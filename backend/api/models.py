from django.db import models
from django.contrib.auth.models import AbstractUser
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
    
    # WhatsApp Requests Permission
    can_send_whatsapp = models.BooleanField(default=False, verbose_name="إرسال طلبات النواقص عبر الواتساب")

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
    print_house = models.CharField(max_length=150, blank=True, null=True, verbose_name="المطبعة")
    print_cost_per_piece = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, verbose_name="تكلفة الطباعة للقطعة")
    
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
    cost_per_piece = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, verbose_name="سعر الطباعة للقطعة")
    dispatch_date = models.DateField(verbose_name="تاريخ الإرسال")
    status = models.CharField(max_length=50, default="في المطبعة", verbose_name="الحالة")
    received_date = models.DateField(blank=True, null=True, verbose_name="تاريخ الاستلام")
    created_at = models.DateTimeField(auto_now_add=True)
