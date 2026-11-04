from rest_framework import serializers
from .models import (
    Role, UserProfile, Fabric, Accessory, 
    ModelItem, ModelAccessory, ModelTimeline, 
    CuttingRecord, QCRecord, PrintDispatch
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


class AccessorySerializer(serializers.ModelSerializer):
    deficit_quantity = serializers.ReadOnlyField()

    class Meta:
        model = Accessory
        fields = '__all__'


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
    class Meta:
        model = PrintDispatch
        fields = '__all__'


class ModelItemSerializer(serializers.ModelSerializer):
    accessories = ModelAccessorySerializer(many=True, read_only=True)
    timeline = ModelTimelineSerializer(many=True, read_only=True)
    cutting_records = CuttingRecordSerializer(many=True, read_only=True)
    qc_records = QCRecordSerializer(many=True, read_only=True)
    dispatches = PrintDispatchSerializer(many=True, read_only=True)

    class Meta:
        model = ModelItem
        fields = '__all__'
