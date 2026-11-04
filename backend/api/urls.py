from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoleViewSet, UserProfileViewSet, FabricViewSet,
    AccessoryViewSet, ModelItemViewSet, CuttingRecordViewSet,
    QCRecordViewSet, PrintDispatchViewSet, SewingDispatchViewSet,
    NotificationViewSet, InternalMessageViewSet
)

router = DefaultRouter()
router.register(r'roles', RoleViewSet)
router.register(r'users', UserProfileViewSet)
router.register(r'fabrics', FabricViewSet)
router.register(r'accessories', AccessoryViewSet)
router.register(r'models', ModelItemViewSet)
router.register(r'cutting-records', CuttingRecordViewSet)
router.register(r'qc-records', QCRecordViewSet)
router.register(r'dispatches', PrintDispatchViewSet)
router.register(r'sewing-dispatches', SewingDispatchViewSet)
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'internal-messages', InternalMessageViewSet, basename='internal-messages')

urlpatterns = [
    path('', include(router.urls)),
]
