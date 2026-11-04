from rest_framework import serializers
from .models import (
    Role, UserProfile, Fabric, Accessory, 
    ModelItem, ModelAccessory, ModelTimeline, 
    CuttingRecord, QCRecord, PrintDispatch,
    SewingDispatch, AppNotification
)

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'


class UserProfileSerializer(serializers.ModelSerializer):
    role_details = RoleSerializer(source='role', read_only=True)

    class Meta:
        model = UserProfile
        fields = '__all__'


class FabricSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fabric
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if request:
            user_profile = getattr(request, 'user_profile', None)
            if user_profile and not user_profile.has_perm('can_view_fabric_prices'):
                ret['price_per_meter'] = None
        return ret


class AccessorySerializer(serializers.ModelSerializer):
    deficit_quantity = serializers.ReadOnlyField()

    class Meta:
        model = Accessory
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if request:
            user_profile = getattr(request, 'user_profile', None)
            if user_profile and not user_profile.has_perm('can_view_accessory_prices'):
                ret['price_per_unit'] = None
        return ret


class ModelAccessorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelAccessory
        fields = '__all__'


class ModelTimelineSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelTimeline
        fields = '__all__'


class CuttingRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuttingRecord
        fields = '__all__'


class QCRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = QCRecord
        fields = '__all__'


class PrintDispatchSerializer(serializers.ModelSerializer):
    is_overdue = serializers.ReadOnlyField()

    class Meta:
        model = PrintDispatch
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if request:
            user_profile = getattr(request, 'user_profile', None)
            if user_profile and not user_profile.has_perm('can_view_printing_costs'):
                ret['cost_per_piece'] = None
        return ret


class SewingDispatchSerializer(serializers.ModelSerializer):
    is_overdue = serializers.ReadOnlyField()

    class Meta:
        model = SewingDispatch
        fields = '__all__'


class AppNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppNotification
        fields = '__all__'


class ModelItemSerializer(serializers.ModelSerializer):
    accessories = ModelAccessorySerializer(many=True, read_only=True)
    timeline = ModelTimelineSerializer(many=True, read_only=True)
    cutting_records = CuttingRecordSerializer(many=True, read_only=True)
    qc_records = QCRecordSerializer(many=True, read_only=True)
    dispatches = PrintDispatchSerializer(many=True, read_only=True)
    sewing_dispatches = SewingDispatchSerializer(many=True, read_only=True)

    class Meta:
        model = ModelItem
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if request:
            user_profile = getattr(request, 'user_profile', None)
            if user_profile and not user_profile.has_perm('can_view_printing_costs'):
                ret['print_cost_per_piece'] = None
        return ret
