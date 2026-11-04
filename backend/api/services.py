from datetime import date, timedelta
from .models import (
    Accessory, 
    PrintDispatch, 
    SewingDispatch, 
    ModelItem, 
    ModelTimeline,
    AppNotification
)

def get_accessory_deficits():
    """
    Computes stock deficits and model-specific deficits separately.
    """
    accessories = Accessory.objects.all()
    stock_deficits = []
    model_deficits = []

    for item in accessories:
        if item.usage_type == 'custom_model':
            if item.withdrawn_for_model:
                continue
            deficit = max(0, item.target_quantity - item.delivered_quantity)
            if deficit > 0:
                model_deficits.append({
                    'id': item.id,
                    'code': item.custom_model_code or 'خاص',
                    'name': item.name,
                    'usage_type': 'custom_model',
                    'custom_model_code': item.custom_model_code,
                    'current_stock': item.current_stock,
                    'delivered_quantity': item.delivered_quantity,
                    'target_quantity': item.target_quantity,
                    'deficit': deficit,
                    'unit': item.unit,
                    'supplier': item.supplier
                })
        else:
            deficit = max(0, item.min_threshold - item.current_stock)
            if item.current_stock <= item.min_threshold:
                stock_deficits.append({
                    'id': item.id,
                    'code': f"ACC-{item.id}",
                    'name': item.name,
                    'usage_type': 'stock',
                    'current_stock': item.current_stock,
                    'min_threshold': item.min_threshold,
                    'deficit': deficit,
                    'unit': item.unit,
                    'supplier': item.supplier
                })

    return {
        'stock_deficits': stock_deficits,
        'model_deficits': model_deficits,
        'total_count': len(stock_deficits) + len(model_deficits)
    }


def generate_smart_delivery_notifications():
    """
    Computes delivery date notifications for PrintDispatches and SewingDispatches:
    - 1 day before: Tomorrow notification
    - On date: Today notification
    - Past date without receipt: Overdue (stays active until received)
    """
    today = date.today()
    tomorrow = today + timedelta(days=1)
    notifications = []

    # 1. Print Dispatches
    active_prints = PrintDispatch.objects.filter(status__in=['في المطبعة', 'مرسل للمطبعة'])
    for disp in active_prints:
        if not disp.expected_delivery_date:
            continue
        exp = disp.expected_delivery_date
        code = disp.model.model_code
        if exp < today:
            days = (today - exp).days
            notifications.append({
                'id': f"print-overdue-{disp.id}",
                'title': 'متأخر عن موعد الاستلام',
                'urgency': 'overdue',
                'stage': 'printing',
                'model_code': code,
                'model_id': disp.model_id,
                'target_name': disp.print_house,
                'expected_date': exp.isoformat(),
                'message': f"الموديل {code} متأخر {days} يوم عن موعد الاستلام المحدد من مطبعة {disp.print_house}!"
            })
        elif exp == today:
            notifications.append({
                'id': f"print-today-{disp.id}",
                'title': 'موعد الاستلام اليوم',
                'urgency': 'today',
                'stage': 'printing',
                'model_code': code,
                'model_id': disp.model_id,
                'target_name': disp.print_house,
                'expected_date': exp.isoformat(),
                'message': f"اليوم هو موعد استلام تشغيلة الموديل {code} من مطبعة {disp.print_house} ({disp.pieces_count} قطعة)."
            })
        elif exp == tomorrow:
            notifications.append({
                'id': f"print-tomorrow-{disp.id}",
                'title': 'موعد الاستلام غداً',
                'urgency': 'tomorrow',
                'stage': 'printing',
                'model_code': code,
                'model_id': disp.model_id,
                'target_name': disp.print_house,
                'expected_date': exp.isoformat(),
                'message': f"غداً موعد استلام الموديل {code} من مطبعة {disp.print_house}."
            })

    # 2. Sewing Dispatches
    active_sewing = SewingDispatch.objects.filter(status='قيد الخياطة والتشغيل')
    for disp in active_sewing:
        if not disp.expected_delivery_date:
            continue
        exp = disp.expected_delivery_date
        code = disp.model.model_code
        piece_suffix = f" [{disp.piece_label or ('تيشرت' if disp.piece_type == 'shirt' else 'بنطلون')}]"
        
        if exp < today:
            days = (today - exp).days
            notifications.append({
                'id': f"sewing-overdue-{disp.id}",
                'title': f"متأخر عن موعد الاستلام{piece_suffix}",
                'urgency': 'overdue',
                'stage': 'sewing',
                'model_code': code,
                'model_id': disp.model_id,
                'target_name': disp.workshop_name,
                'expected_date': exp.isoformat(),
                'message': f"الموديل {code}{piece_suffix} متأخر {days} يوم عن موعد الاستلام المحدد من ورشة المكن ({disp.workshop_name})!"
            })
        elif exp == today:
            notifications.append({
                'id': f"sewing-today-{disp.id}",
                'title': f"موعد الاستلام اليوم{piece_suffix}",
                'urgency': 'today',
                'stage': 'sewing',
                'model_code': code,
                'model_id': disp.model_id,
                'target_name': disp.workshop_name,
                'expected_date': exp.isoformat(),
                'message': f"اليوم هو موعد استلام تشغيلة الموديل {code}{piece_suffix} من ورشة المكن ({disp.workshop_name}) - عدد {disp.pieces_count} قطعة."
            })
        elif exp == tomorrow:
            notifications.append({
                'id': f"sewing-tomorrow-{disp.id}",
                'title': f"موعد الاستلام غداً{piece_suffix}",
                'urgency': 'tomorrow',
                'stage': 'sewing',
                'model_code': code,
                'model_id': disp.model_id,
                'target_name': disp.workshop_name,
                'expected_date': exp.isoformat(),
                'message': f"غداً موعد استلام الموديل {code}{piece_suffix} من ورشة الخياطة ({disp.workshop_name})."
            })

    # Sort: overdue first, then today, then tomorrow
    urgency_weights = {'overdue': 0, 'today': 1, 'tomorrow': 2}
    notifications.sort(key=lambda n: urgency_weights.get(n['urgency'], 3))
    return notifications


def dispatch_model_to_sewing_service(model_id, workshop_name, pieces_count, expected_delivery_date, notes=None, user_name='مدير الإنتاج', piece_type='shirt', piece_label=None):
    """
    Records sewing dispatch and moves model into sewing stage with independent piece tracking.
    """
    model = ModelItem.objects.get(id=model_id)
    resolved_label = piece_label or ('تيشرت' if piece_type == 'shirt' else 'بنطلون')
    
    if piece_type == 'shirt':
        model.sewing_shirt_workshop = workshop_name
        model.sewing_shirt_expected_date = expected_delivery_date
        model.sewing_shirt_status = 'dispatched'
        model.sewing_shirt_pieces = pieces_count
    else:
        model.sewing_pants_workshop = workshop_name
        model.sewing_pants_expected_date = expected_delivery_date
        model.sewing_pants_status = 'dispatched'
        model.sewing_pants_pieces = pieces_count
        
    model.sewing_workshop = workshop_name
    model.sewing_expected_date = expected_delivery_date
    model.sewing_pieces_count = pieces_count
    model.status = 'في قسم المكن'
    model.save()

    dispatch = SewingDispatch.objects.create(
        model=model,
        piece_type=piece_type,
        piece_label=resolved_label,
        workshop_name=workshop_name,
        pieces_count=pieces_count,
        expected_delivery_date=expected_delivery_date,
        notes=notes or ''
    )

    ModelTimeline.objects.create(
        model=model,
        stage=f'إرسال إلى ورشة المكن ({resolved_label})',
        user=user_name,
        notes=f"تم إرسال {pieces_count} قطعة [{resolved_label}] إلى ورشة {workshop_name} (موعد الاستلام: {expected_delivery_date})"
    )

    return dispatch


def receive_model_from_sewing_service(dispatch_id, user_name='مراقب الجودة'):
    """
    Receives model from sewing workshop and routes it to QC (العد بعد المكن).
    """
    dispatch = SewingDispatch.objects.get(id=dispatch_id)
    dispatch.status = 'تم الاستلام'
    dispatch.received_date = date.today()
    dispatch.save()

    model = dispatch.model
    if dispatch.piece_type == 'shirt':
        model.sewing_shirt_status = 'received'
    else:
        model.sewing_pants_status = 'received'
        
    # Check if all active pieces are received
    # If both shirt and pants are received or only one piece type was used
    all_done = True
    if model.sewing_shirt_status == 'dispatched' or model.sewing_pants_status == 'dispatched':
        all_done = False
        
    if all_done:
        model.status = 'العد بعد المكن'
    model.save()

    label = dispatch.piece_label or ('تيشرت' if dispatch.piece_type == 'shirt' else 'بنطلون')
    ModelTimeline.objects.create(
        model=model,
        stage=f'استلام من ورشة المكن ({label})',
        user=user_name,
        notes=f"تم استلام {dispatch.pieces_count} قطعة [{label}] من ورشة {dispatch.workshop_name}{' ونقل الموديل بالكامل للفرز والكنترول (العد بعد المكن)' if all_done else ''}"
    )

    return dispatch

