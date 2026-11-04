from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import (
    Role, UserProfile, Fabric, Accessory, 
    ModelItem, ModelAccessory, ModelTimeline, 
    CuttingRecord, QCRecord, PrintDispatch
)
from .serializers import (
    RoleSerializer, UserProfileSerializer, FabricSerializer,
    AccessorySerializer, ModelItemSerializer, CuttingRecordSerializer,
    QCRecordSerializer, PrintDispatchSerializer
)

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer


class FabricViewSet(viewsets.ModelViewSet):
    queryset = Fabric.objects.all()
    serializer_class = FabricSerializer


class AccessoryViewSet(viewsets.ModelViewSet):
    queryset = Accessory.objects.all()
    serializer_class = AccessorySerializer

    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """Returns accessories with deficit (excludes fully withdrawn custom models)"""
        stock_alerts = Accessory.objects.filter(usage_type='stock', current_stock__lt=models.F('min_threshold'))
        custom_alerts = Accessory.objects.filter(usage_type='custom_model', withdrawn_for_model=False, delivered_quantity__lt=models.F('target_quantity'))
        all_alerts = stock_alerts | custom_alerts
        return Response(AccessorySerializer(all_alerts, many=True).data)

    @action(detail=True, methods=['post'])
    def mark_withdrawn(self, request, pk=None):
        accessory = self.get_object()
        accessory.withdrawn_for_model = True
        accessory.save()
        return Response({'status': 'marked as withdrawn for model'})


class ModelItemViewSet(viewsets.ModelViewSet):
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
        return Response(ModelItemSerializer(model).data)

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
        return Response(ModelItemSerializer(model).data)

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
        return Response(ModelItemSerializer(model).data)


class CuttingRecordViewSet(viewsets.ModelViewSet):
    queryset = CuttingRecord.objects.all()
    serializer_class = CuttingRecordSerializer


class QCRecordViewSet(viewsets.ModelViewSet):
    queryset = QCRecord.objects.all()
    serializer_class = QCRecordSerializer


class PrintDispatchViewSet(viewsets.ModelViewSet):
    queryset = PrintDispatch.objects.all()
    serializer_class = PrintDispatchSerializer
