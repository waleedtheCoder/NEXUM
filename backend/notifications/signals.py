from django.db.models.signals import post_save
from django.dispatch import receiver


def _on_notification_created(sender, instance, created, **kwargs):
    """
    Fires after every Notification row is created.
    Builds a deep-link data payload based on notification type,
    then calls send_push_to_user() to deliver the FCM push.
    """
    if not created:
        return

    from .fcm import send_push_to_user

    # Build deep-link routing data so the app can navigate on tap
    data = {'screen': 'Notifications', 'notifId': str(instance.id)}

    if instance.type == 'message' and instance.conversation_id:
        data = {
            'screen': 'ChatConversation',
            'convId': str(instance.conversation_id),
        }
    elif instance.type in ('order', 'listing') and instance.listing_id:
        data = {
            'screen':    'ProductDetail',
            'listingId': str(instance.listing_id),
        }

    send_push_to_user(
        user=instance.user,
        title=instance.title,
        body=instance.body,
        data=data,
    )


def connect_signals():
    """Called from NotificationsConfig.ready() to register the signal."""
    from .models import Notification
    post_save.connect(_on_notification_created, sender=Notification, weak=False)
