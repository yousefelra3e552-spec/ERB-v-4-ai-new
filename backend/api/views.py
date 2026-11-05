from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from django.utils import timezone
from datetime import date
from .models import (
    Role, UserProfile, Fabric, Accessory, 
    ModelItem, ModelAccessory, ModelTimeline, 
    CuttingRecord, QCRecord, PrintDispatch,
    SewingDispatch, AppNotification, InternalMessage
)
from .serializers import (
    RoleSerializer, UserProfileSerializer, FabricSerializer,
    AccessorySerializer, ModelItemSerializer, CuttingRecordSerializer,
    QCRecordSerializer, PrintDispatchSerializer, SewingDispatchSerializer,
    AppNotificationSerializer, InternalMessageSerializer
)
from .services import (
    get_accessory_deficits, 
    generate_smart_delivery_notifications,
    dispatch_model_to_sewing_service,
    receive_model_from_sewing_service
)
from .reports import get_production_report
from .permissions import HasDynamicSectionPermission

class BasePermViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet attaching current user_profile to request for financial price masking.
    """
    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        username = request.headers.get('X-User-Username') or getattr(request.user, 'username', 'sudo')
        try:
            request.user_profile = UserProfile.objects.select_related('role').get(username=username)
        except UserProfile.DoesNotExist:
            request.user_profile = None

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class RoleViewSet(BasePermViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer


class UserProfileViewSet(BasePermViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer


class FabricViewSet(BasePermViewSet):
    queryset = Fabric.objects.all()
    serializer_class = FabricSerializer
    required_section = 'fabric'


class AccessoryViewSet(BasePermViewSet):
    queryset = Accessory.objects.all()
    serializer_class = AccessorySerializer
    required_section = 'accessories'

    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """
        Returns accessories deficits partitioned into Stock and Model-Specific.
        """
        result = get_accessory_deficits()
        return Response(result)

    @action(detail=True, methods=['post'])
    def mark_withdrawn(self, request, pk=None):
        accessory = self.get_object()
        accessory.withdrawn_for_model = True
        accessory.save()
        return Response({'status': 'marked as withdrawn for model', 'accessory_id': accessory.id})


class ModelItemViewSet(BasePermViewSet):
    queryset = ModelItem.objects.filter(is_deleted=False)
    serializer_class = ModelItemSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        stage = self.request.query_params.get('stage')
        if stage == 'design':
            return queryset.filter(status__in=['مرحلة التصميم', 'تصميم'])
        elif stage == 'cutting':
            return queryset.filter(status__in=['جاري القص', 'في القص'])
        elif stage == 'printing':
            return queryset.filter(status__in=['جاهز للمطبعة', 'في المطبعة'])
        elif stage == 'sewing':
            return queryset.filter(status='في قسم المكن')
        elif stage == 'completed':
            return queryset.filter(status='مكتمل الإنتاج')
        return queryset

    @action(detail=True, methods=['post'])
    def dispatch_to_sewing(self, request, pk=None):
        workshop_name = request.data.get('workshop_name')
        pieces_count = int(request.data.get('pieces_count', 0))
        expected_date = request.data.get('expected_delivery_date')
        notes = request.data.get('notes', '')
        user = request.data.get('user', 'مدير الإنتاج')
        piece_type = request.data.get('piece_type', 'shirt')
        piece_label = request.data.get('piece_label')

        if not workshop_name or not expected_date or pieces_count <= 0:
            return Response({'error': 'اسم الورشة وتاريخ الاستلام المتوقع والقطع المسلمة مطلوبة'}, status=status.HTTP_400_BAD_REQUEST)

        disp = dispatch_model_to_sewing_service(
            pk, workshop_name, pieces_count, expected_date, notes, user, piece_type, piece_label
        )
        return Response(SewingDispatchSerializer(disp).data)

    @action(detail=True, methods=['post'])
    def record_qc_count(self, request, pk=None):
        model = self.get_object()
        stage = request.data.get('stage') # before_print, after_print, after_sewing
        counted = int(request.data.get('counted_pieces', 0))
        defects = int(request.data.get('defect_pieces', 0))
        notes = request.data.get('notes', '')
        user = request.data.get('user', 'فاحص الجودة')

        QCRecord.objects.create(
            model=model,
            stage=stage,
            counted_pieces=counted,
            defect_pieces=defects,
            notes=notes,
            checked_by=user
        )

        if stage == 'before_print':
            model.count_before_print = counted
            model.status = 'جاهز للمطبعة'
            ModelTimeline.objects.create(
                model=model,
                stage="إنهاء العد قبل الطباعة والتحويل لقسم المطابع",
                notes=f"العدد السليم: {counted} ق، الهوالك: {defects} ق. {notes}",
                user=user
            )
        elif stage == 'after_print':
            model.count_after_print = counted
            model.status = 'في قسم المكن'
            ModelTimeline.objects.create(
                model=model,
                stage="إنهاء العد بعد الطباعة والتحويل لقسم المكن",
                notes=f"العدد السليم: {counted} ق، الهوالك: {defects} ق. {notes}",
                user=user
            )
        elif stage == 'after_sewing':
            model.count_after_sewing = counted
            model.status = 'مكتمل الإنتاج'
            ModelTimeline.objects.create(
                model=model,
                stage="إنهاء العد النهائي والتحويل لمخزن الإنتاج",
                notes=f"العدد السليم المكتمل: {counted} ق، الهوالك: {defects} ق. {notes}",
                user=user
            )

        model.save()
        return Response(ModelItemSerializer(model, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def finish_sewing(self, request, pk=None):
        model = self.get_object()
        model.status = 'العد بعد المكن'
        model.save()
        ModelTimeline.objects.create(
            model=model,
            stage="إنهاء الخياطة بقسم المكن",
            notes="تم الانتهاء من تجميع الموديل وتحويله للعد النهائي بالفرز والكنترول",
            user=request.data.get('user', 'مشرف المكن')
        )
        return Response(ModelItemSerializer(model, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def receive_from_print(self, request, pk=None):
        model = self.get_object()
        model.status = 'العد بعد الطباعة'
        model.save()
        ModelTimeline.objects.create(
            model=model,
            stage="استلام من المطبعة",
            notes=f"تم استلام الموديل من مطبعة {model.print_house} وتوجيهه للعد بعد الطباعة",
            user=request.data.get('user', 'أمين المخزن')
        )
        return Response(ModelItemSerializer(model, context={'request': request}).data)


class CuttingRecordViewSet(BasePermViewSet):
    queryset = CuttingRecord.objects.all()
    serializer_class = CuttingRecordSerializer


class QCRecordViewSet(BasePermViewSet):
    queryset = QCRecord.objects.all()
    serializer_class = QCRecordSerializer


class PrintDispatchViewSet(BasePermViewSet):
    queryset = PrintDispatch.objects.all()
    serializer_class = PrintDispatchSerializer

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        disp = self.get_object()
        disp.status = 'تم الاستلام'
        disp.received_date = date.today()
        disp.save()
        
        m = disp.model
        m.status = 'العد بعد الطباعة'
        m.save()

        ModelTimeline.objects.create(
            model=m,
            stage="استلام من المطبعة والتحويل للعد بعد الطباعة",
            notes=f"تم استلام تشغيلة {disp.pieces_count} قطعة من مطبعة {disp.print_house}",
            user=request.data.get('user', 'مسؤول الاستلام')
        )
        return Response(PrintDispatchSerializer(disp, context={'request': request}).data)


class SewingDispatchViewSet(BasePermViewSet):
    queryset = SewingDispatch.objects.all()
    serializer_class = SewingDispatchSerializer

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        user = request.data.get('user', 'مراقب الجودة')
        disp = receive_model_from_sewing_service(pk, user)
        return Response(SewingDispatchSerializer(disp, context={'request': request}).data)


class NotificationViewSet(viewsets.ViewSet):
    """
    Smart In-App Notifications for Expected Delivery Dates (Printing & Sewing).
    """
    def list(self, request):
        notifs = generate_smart_delivery_notifications()
        return Response({
            'notifications': notifs,
            'total_count': len(notifs),
            'overdue_count': sum(1 for n in notifs if n['urgency'] == 'overdue'),
            'today_count': sum(1 for n in notifs if n['urgency'] == 'today'),
            'tomorrow_count': sum(1 for n in notifs if n['urgency'] == 'tomorrow')
        })


class InternalMessageViewSet(BasePermViewSet):
    """
    Internal direct messaging between system users.
    Enforces can_send_messages permission before allowing sending.
    """
    queryset = InternalMessage.objects.all()
    serializer_class = InternalMessageSerializer

    def get_queryset(self):
        user_profile = getattr(self.request, 'user_profile', None)
        if not user_profile:
            return InternalMessage.objects.all()
        # Return messages where current user is either sender or receiver
        return InternalMessage.objects.filter(
            models.Q(sender=user_profile) | models.Q(receiver=user_profile)
        )

    def create(self, request, *args, **kwargs):
        user_profile = getattr(request, 'user_profile', None)
        if not user_profile:
            return Response({'error': 'المستخدم غير معرف'}, status=status.HTTP_401_UNAUTHORIZED)

        # Dynamic permission check: must have can_send_messages or is_sudo
        if not user_profile.has_perm('can_send_messages'):
            return Response(
                {'error': 'ليس لديك صلاحية إرسال الرسائل والمراسلات الداخلية. يرجى مراجعة إدارة Sudo.'},
                status=status.HTTP_403_FORBIDDEN
            )

        receiver_id = request.data.get('receiver')
        content = request.data.get('content', '').strip()

        if not receiver_id or not content:
            return Response({'error': 'يجب تحديد المستلم وكتابة نص الرسالة'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            receiver = UserProfile.objects.get(id=receiver_id)
        except UserProfile.DoesNotExist:
            return Response({'error': 'المستلم غير موجود'}, status=status.HTTP_404_NOT_FOUND)

        msg = InternalMessage.objects.create(
            sender=user_profile,
            receiver=receiver,
            content=content
        )
        return Response(InternalMessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        msg = self.get_object()
        msg.is_read = True
        msg.save()
        return Response({'status': 'marked as read', 'message_id': msg.id})


class ReportsViewSet(viewsets.ViewSet):
    """
    Production Analytics & Aggregation Reports (Cutting, Printing, QC, Sewing).
    Supports Daily, Weekly, and Monthly grouping with Trunc and Aggregations.
    Enforces can_reports / reports_view permission.
    """
    def list(self, request):
        username = request.headers.get('X-User-Username') or getattr(request.user, 'username', 'sudo')
        user_profile = None
        try:
            user_profile = UserProfile.objects.select_related('role').get(username=username)
        except UserProfile.DoesNotExist:
            pass

        # Permission check: must have can_reports or be sudo
        if user_profile and not user_profile.is_sudo:
            if not user_profile.has_perm('can_reports') and not user_profile.has_perm('reports_view'):
                return Response(
                    {'error': 'ليس لديك صلاحية الاطلاع على التقارير والإحصائيات. يرجى مراجعة إدارة Sudo.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        section = request.query_params.get('section', 'cutting')
        period = request.query_params.get('period', 'daily')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        report_data = get_production_report(
            section=section,
            period=period,
            date_from=date_from,
            date_to=date_to
        )
        return Response(report_data)


