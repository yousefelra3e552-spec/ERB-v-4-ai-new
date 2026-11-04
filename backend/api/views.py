from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import date
from .models import (
    Role, UserProfile, Fabric, Accessory, 
    ModelItem, ModelAccessory, ModelTimeline, 
    CuttingRecord, QCRecord, PrintDispatch,
    SewingDispatch, AppNotification
)
from .serializers import (
    RoleSerializer, UserProfileSerializer, FabricSerializer,
    AccessorySerializer, ModelItemSerializer, CuttingRecordSerializer,
    QCRecordSerializer, PrintDispatchSerializer, SewingDispatchSerializer,
    AppNotificationSerializer
)
from .services import (
    get_accessory_deficits, 
    generate_smart_delivery_notifications,
    dispatch_model_to_sewing_service,
    receive_model_from_sewing_service
)
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

        if not workshop_name or not expected_date or pieces_count <= 0:
            return Response({'error': 'اسم الورشة وتاريخ الاستلام المتوقع والقطع المسلمة مطلوبة'}, status=status.HTTP_400_BAD_REQUEST)

        disp = dispatch_model_to_sewing_service(pk, workshop_name, pieces_count, expected_date, notes, user)
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
