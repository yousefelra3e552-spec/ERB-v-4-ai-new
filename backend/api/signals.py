from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import ModelItem, ModelTimeline

@receiver(pre_save, sender=ModelItem)
def track_model_status_change(sender, instance, **kwargs):
    if instance.pk:
        try:
            previous = ModelItem.objects.get(pk=instance.pk)
            if previous.status != instance.status:
                instance._status_changed = (previous.status, instance.status)
        except ModelItem.DoesNotExist:
            pass

@receiver(post_save, sender=ModelItem)
def log_model_timeline(sender, instance, created, **kwargs):
    if created:
        ModelTimeline.objects.create(
            model=instance,
            stage=instance.status,
            notes="تم إنشاء الموديل وإدراجه في النظام",
            user="النظام"
        )
    elif hasattr(instance, '_status_changed'):
        old_status, new_status = instance._status_changed
        ModelTimeline.objects.create(
            model=instance,
            stage=new_status,
            notes=f"انتقال الموديل من مرحلة [{old_status}] إلى مرحلة [{new_status}]",
            user="النظام"
        )
