from django.db import models
from django.contrib.auth.models import AbstractUser
from datetime import date, timedelta
import json

class Role(models.Model):
    """
    Dynamic Role model - completely customizable by Sudo without hardcoded limitations.
    """
    name = models.CharField(max_length=100, unique=True, verbose_name="اسم الدور")
    description = models.TextField(blank=True, null=True, verbose_name="الوصف")
    
    # Section Permissions
    can_fabric_warehouse = models.BooleanField(default=False, verbose_name="مخزن القماش")
    can_accessories_warehouse = models.BooleanField(default=False, verbose_name="مخزن الإكسسوارات")
    can_production_warehouse = models.BooleanField(default=False, verbose_name="مخزن الإنتاج")
    can_design = models.BooleanField(default=False, verbose_name="التصميم")
    can_cutting = models.BooleanField(default=False, verbose_name="القص")
    can_printing = models.BooleanField(default=False, verbose_name="المطابع والتطريز")
    can_qc = models.BooleanField(default=False, verbose_name="الفرز والكنترول")
    can_sewing = models.BooleanField(default=False, verbose_name="قسم المكن")
    can_models_tracking = models.BooleanField(default=False, verbose_name="حركة وتفاصيل الموديلات")
    
    # Financial Permissions
    can_view_fabric_prices = models.BooleanField(default=False, verbose_name="رؤية أسعار القماش")
    can_edit_fabric_prices = models.BooleanField(default=False, verbose_name="تعديل أسعار القماش")
    can_view_accessory_prices = models.BooleanField(default=False, verbose_name="رؤية أسعار الإكسسوارات")
    can_edit_accessory_prices = models.BooleanField(default=False, verbose_name="تعديل أسعار الإكسسوارات")
    can_view_printing_costs = models.BooleanField(default=False, verbose_name="رؤية تكاليف المطابع")
    can_edit_printing_costs = models.BooleanField(default=False, verbose_name="تعديل تكاليف المطابع")
    
    # Sensitive & Communication Permissions
    can_send_whatsapp = models.BooleanField(default=False, verbose_name="إرسال طلبات النواقص عبر الواتساب")
    can_send_messages = models.BooleanField(default=False, verbose_name="إرسال الرسائل والمراسلات الداخلية")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    username = models.CharField(max_length=150, unique=True, verbose_name="اسم المستخدم")
    real_name = models.CharField(max_length=200, verbose_name="الاسم الحقيقي")
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name="users")
    is_sudo = models.BooleanField(default=False, verbose_name="حساب الإدارة العليا Sudo")
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    custom_permissions = models.JSONField(default=dict, blank=True, verbose_name="تخصيص صلاحيات إضافية")

    def has_perm(self, perm_name):
        if self.is_sudo:
            return True
        if perm_name in self.custom_permissions:
            return bool(self.custom_permissions[perm_name])
        if self.role and hasattr(self.role, perm_name):
            return getattr(self.role, perm_name)
        return False

    def __str__(self):
        return f"{self.real_name} ({self.username})"


class Fabric(models.Model):
    name = models.CharField(max_length=200, verbose_name="اسم القماش / الخامة")
    color = models.CharField(max_length=100, verbose_name="اللون")
    roll_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="رقم التوب")
    quantity_kg = models.FloatField(default=0.0, verbose_name="الوزن بالكيلو")
    supplier = models.CharField(max_length=200, blank=True, null=True, verbose_name="المورد")
    price_per_meter = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, verbose_name="سعر المتر")
    notes = models.TextField(blank=True, null=True, verbose_name="ملاحظات")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.color}"


class Accessory(models.Model):
    USAGE_TYPES = [
        ('stock', 'رصيد مستمر (Stock)'),
        ('custom_model', 'استخدام واحد لموديل معين'),
    ]

    name = models.CharField(max_length=200, verbose_name="اسم الصنف")
    usage_type = models.CharField(max_length=20, choices=USAGE_TYPES, default='stock', verbose_name="نوع الاستخدام")
    custom_model_code = models.CharField(max_length=100, blank=True, null=True, verbose_name="كود الموديل المخصص له")
    unit = models.CharField(max_length=50, default="قطعة", verbose_name="وحدة القياس")
    current_stock = models.IntegerField(default=0, verbose_name="الرصيد الفعلي الحالي")
    min_threshold = models.IntegerField(default=10, verbose_name="الحد الأدنى للتنبيه")
    
    # For custom_model usage type
    target_quantity = models.IntegerField(default=0, verbose_name="الكمية المطلوبة / المستهدفة")
    delivered_quantity = models.IntegerField(default=0, verbose_name="الكمية التي تم توريدها")
    withdrawn_for_model = models.BooleanField(default=False, verbose_name="تم سحبه واكتماله بالكامل للموديل")
    
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, verbose_name="سعر الوحدة")
    supplier = models.CharField(max_length=200, blank=True, null=True, verbose_name="المورد")
    notes = models.TextField(blank=True, null=True)

    @property
    def deficit_quantity(self):
        if self.usage_type == 'custom_model':
            if self.withdrawn_for_model:
                return 0
            return max(0, self.target_quantity - self.delivered_quantity)
        return max(0, self.min_threshold - self.current_stock)

    def __str__(self):
        return f"{self.name} ({self.get_usage_type_display()})"


class ModelItem(models.Model):
    STATUS_CHOICES = [
        ('مرحلة التصميم', 'مرحلة التصميم'),
        ('جاري القص', 'جاري القص'),
        ('فرز وكنترول', 'فرز وكنترول (قبل الطباعة)'),
        ('جاهز للمطبعة', 'جاهز للمطبعة'),
        ('في المطبعة', 'في المطبعة'),
        ('العد بعد الطباعة', 'العد بعد الطباعة'),
        ('في قسم المكن', 'في قسم المكن (الخياطة)'),
        ('العد بعد المكن', 'العد بعد المكن (الفحص النهائي)'),
        ('مكتمل الإنتاج', 'مكتمل الإنتاج (مخزن الإنتاج)'),
    ]

    model_code = models.CharField(max_length=100, unique=True, verbose_name="كود الموديل")
    model_type = models.CharField(max_length=100, blank=True, null=True, verbose_name="نوع الموديل")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='مرحلة التصميم', verbose_name="الحالة")
    
    target_cut_quantity = models.IntegerField(default=0, verbose_name="العدد المستهدف للقص")
    total_cut_pieces = models.IntegerField(default=0, verbose_name="العدد المقصوص فعلياً")
    
    # Stage Counts
    count_before_print = models.IntegerField(default=0, blank=True, null=True, verbose_name="العد قبل الطباعة")
    count_after_print = models.IntegerField(default=0, blank=True, null=True, verbose_name="العد بعد الطباعة")
    count_after_sewing = models.IntegerField(default=0, blank=True, null=True, verbose_name="العد بعد المكن")
    
    cutter_name = models.CharField(max_length=150, blank=True, null=True, verbose_name="المقصدار")
    
    # Printing info
    print_house = models.CharField(max_length=150, blank=True, null=True, verbose_name="المطبعة")
    print_expected_date = models.DateField(blank=True, null=True, verbose_name="تاريخ الاستلام المتوقع من المطبعة")
    print_cost_per_piece = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, verbose_name="تكلفة الطباعة للقطعة")
    
    # Sewing workshop info
    sewing_workshop = models.CharField(max_length=150, blank=True, null=True, verbose_name="اسم ورشة المكن / الخياطة")
    sewing_expected_date = models.DateField(blank=True, null=True, verbose_name="تاريخ الاستلام المتوقع من ورشة المكن")
    sewing_pieces_count = models.IntegerField(default=0, verbose_name="عدد القطع بورشة المكن")
    
    # Split Sewing independent tracking for Shirt & Pants
    sewing_shirt_workshop = models.CharField(max_length=150, blank=True, null=True, verbose_name="ورشة مكن التيشرت")
    sewing_shirt_expected_date = models.DateField(blank=True, null=True, verbose_name="تاريخ استلام التيشرت")
    sewing_shirt_status = models.CharField(max_length=50, default="ready", verbose_name="حالة خياطة التيشرت")
    sewing_shirt_pieces = models.IntegerField(default=0, verbose_name="عدد قطع التيشرت")
    
    sewing_pants_workshop = models.CharField(max_length=150, blank=True, null=True, verbose_name="ورشة مكن البنطلون")
    sewing_pants_expected_date = models.DateField(blank=True, null=True, verbose_name="تاريخ استلام البنطلون")
    sewing_pants_status = models.CharField(max_length=50, default="ready", verbose_name="حالة خياطة البنطلون")
    sewing_pants_pieces = models.IntegerField(default=0, verbose_name="عدد قطع البنطلون")
    
    # Separated Notes for Shirt & Pants
    notes_shirt = models.TextField(blank=True, null=True, verbose_name="ملاحظات تشغيل التيشرت")
    notes_pants = models.TextField(blank=True, null=True, verbose_name="ملاحظات تشغيل البنطلون")
    
    image = models.TextField(blank=True, null=True, verbose_name="صورة الموديل (رابط أو Base64)")
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.model_code} - {self.status}"


class ModelAccessory(models.Model):
    TARGET_TYPES = [
        ('shirt', 'تيشرت'),
        ('pants', 'بنطلون'),
    ]
    model = models.ForeignKey(ModelItem, on_delete=models.CASCADE, related_name="accessories")
    accessory_name = models.CharField(max_length=200, verbose_name="اسم الإكسسوار")
    target_type = models.CharField(max_length=20, choices=TARGET_TYPES, default='shirt', verbose_name="القسم المستهدف")
    piece_consumption = models.FloatField(default=1.0, verbose_name="استهلاك القطعة الواحدة")
    unit = models.CharField(max_length=50, default="قطعة", verbose_name="الوحدة")

    def __str__(self):
        return f"{self.accessory_name} ({self.get_target_type_display()}) for {self.model.model_code}"


class ModelTimeline(models.Model):
    model = models.ForeignKey(ModelItem, on_delete=models.CASCADE, related_name="timeline")
    stage = models.CharField(max_length=100, verbose_name="المرحلة")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="التاريخ والوقت")
    notes = models.TextField(blank=True, null=True, verbose_name="تفاصيل وملاحظات")
    user = models.CharField(max_length=150, blank=True, null=True, verbose_name="المستخدم المسؤول")

    class Meta:
        ordering = ['-timestamp']


class CuttingRecord(models.Model):
    model = models.ForeignKey(ModelItem, on_delete=models.CASCADE, related_name="cutting_records")
    fabric_color = models.CharField(max_length=100, verbose_name="لون القماش")
    pieces_count = models.IntegerField(default=0, verbose_name="عدد القطع المقصوصة")
    layers_count = models.IntegerField(default=0, verbose_name="عدد الراقات")
    cutter_name = models.CharField(max_length=150, verbose_name="اسم المقصدار")
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class QCRecord(models.Model):
    STAGE_TYPES = [
        ('before_print', 'العد قبل الطباعة'),
        ('after_print', 'العد بعد الطباعة'),
        ('after_sewing', 'العد بعد المكن'),
    ]
    model = models.ForeignKey(ModelItem, on_delete=models.CASCADE, related_name="qc_records")
    stage = models.CharField(max_length=30, choices=STAGE_TYPES, verbose_name="مرحلة العد والفرز")
    counted_pieces = models.IntegerField(default=0, verbose_name="العدد الفعلي السليم")
    defect_pieces = models.IntegerField(default=0, verbose_name="عدد الهوالك والعيوب")
    notes = models.TextField(blank=True, null=True, verbose_name="ملاحظات الجودة")
    checked_by = models.CharField(max_length=150, verbose_name="مسؤول الفرز")
    created_at = models.DateTimeField(auto_now_add=True)


class PrintDispatch(models.Model):
    model = models.ForeignKey(ModelItem, on_delete=models.CASCADE, related_name="dispatches")
    print_house = models.CharField(max_length=200, verbose_name="اسم المطبعة")
    pieces_count = models.IntegerField(default=0, verbose_name="عدد القطع المرسلة")
    print_type = models.CharField(max_length=100, default="سلك سكرين مائي", verbose_name="نوع الطباعة")
    cost_per_piece = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, verbose_name="سعر الطباعة للقطعة")
    dispatch_date = models.DateField(auto_now_add=True, verbose_name="تاريخ الإرسال")
    expected_delivery_date = models.DateField(verbose_name="تاريخ الاستلام المتوقع")
    status = models.CharField(max_length=50, default="في المطبعة", verbose_name="الحالة")
    received_date = models.DateField(blank=True, null=True, verbose_name="تاريخ الاستلام")
    notes = models.TextField(blank=True, null=True, verbose_name="ملاحظات التشغيل")
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_overdue(self):
        if self.status != 'تم الاستلام' and self.expected_delivery_date:
            return self.expected_delivery_date < date.today()
        return False


class SewingDispatch(models.Model):
    PIECE_CHOICES = [
        ('shirt', 'تيشرت'),
        ('pants', 'بنطلون'),
    ]
    model = models.ForeignKey(ModelItem, on_delete=models.CASCADE, related_name="sewing_dispatches")
    piece_type = models.CharField(max_length=20, choices=PIECE_CHOICES, default='shirt', verbose_name="نوع القطعة")
    piece_label = models.CharField(max_length=50, blank=True, null=True, verbose_name="مسمى القطعة")
    workshop_name = models.CharField(max_length=200, verbose_name="اسم ورشة المكن / الخياطة")
    pieces_count = models.IntegerField(default=0, verbose_name="القطع المسلمة للورشة")
    dispatched_date = models.DateField(auto_now_add=True, verbose_name="تاريخ الخروج للورشة")
    expected_delivery_date = models.DateField(verbose_name="تاريخ الاستلام المتوقع")
    status = models.CharField(max_length=50, default="قيد الخياطة والتشغيل", verbose_name="الحالة")
    received_date = models.DateField(blank=True, null=True, verbose_name="تاريخ الاستلام الفعلي")
    notes = models.TextField(blank=True, null=True, verbose_name="ملاحظات التشغيل")
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_overdue(self):
        if self.status != 'تم الاستلام' and self.expected_delivery_date:
            return self.expected_delivery_date < date.today()
        return False

    def __str__(self):
        label = self.piece_label or self.get_piece_type_display()
        return f"خياطة {self.model.model_code} [{label}] - ورشة {self.workshop_name}"


class AppNotification(models.Model):
    URGENCY_CHOICES = [
        ('overdue', 'متأخر عن موعد الاستلام'),
        ('today', 'موعد الاستلام اليوم'),
        ('tomorrow', 'موعد الاستلام غداً'),
    ]
    STAGE_CHOICES = [
        ('printing', 'المطابع والتطريز'),
        ('sewing', 'ورش المكن والخياطة'),
    ]

    title = models.CharField(max_length=255, verbose_name="عنوان التنبيه")
    message = models.TextField(verbose_name="نص الإشعار")
    urgency = models.CharField(max_length=20, choices=URGENCY_CHOICES, verbose_name="مستوى الأهمية")
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, verbose_name="المرحلة")
    model = models.ForeignKey(ModelItem, on_delete=models.CASCADE, related_name="notifications")
    target_name = models.CharField(max_length=200, verbose_name="اسم الجهة (المطبعة أو الورشة)")
    expected_date = models.DateField(verbose_name="تاريخ الاستلام المتوقع")
    is_read = models.BooleanField(default=False, verbose_name="تمت القراءة")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-urgency', 'expected_date']

    def __str__(self):
        return f"[{self.urgency}] {self.title} - {self.model.model_code}"


class InternalMessage(models.Model):
    """
    Internal direct messaging system between system users.
    Controlled by can_send_messages permission.
    """
    sender = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="sent_messages", verbose_name="المرسل")
    receiver = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="received_messages", verbose_name="المستلم")
    content = models.TextField(verbose_name="نص الرسالة")
    is_read = models.BooleanField(default=False, verbose_name="مقروءة")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ ووقت الإرسال")

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"من {self.sender.real_name} إلى {self.receiver.real_name}: {self.content[:30]}"

