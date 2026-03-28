import logging

import firebase_admin.messaging as fm

logger = logging.getLogger(__name__)


def send_push(*, fcm_token: str, title: str, body: str, data: dict = None):
    """
    Send a single FCM push notification to one device.

    Args:
        fcm_token: device FCM registration token from UserProfile.fcm_token
        title:     notification title string
        body:      notification body string
        data:      optional dict for deep-linking — all values must be strings
                   e.g. { 'screen': 'ChatConversation', 'convId': '5' }

    Never raises — a failed push is logged as a warning and swallowed so it
    can never crash an HTTP request that triggered it.
    """
    if not fcm_token:
        return

    message = fm.Message(
        notification=fm.Notification(title=title, body=body),
        data={k: str(v) for k, v in (data or {}).items()},
        token=fcm_token,
        android=fm.AndroidConfig(priority='high'),
        apns=fm.APNSConfig(
            payload=fm.APNSPayload(
                aps=fm.Aps(sound='default', badge=1)
            )
        ),
    )
    try:
        fm.send(message)
    except Exception as exc:
        logger.warning("FCM send failed (token prefix: %s…): %s", fcm_token[:12], exc)


def send_push_to_user(*, user, title: str, body: str, data: dict = None):
    """
    Convenience helper. Looks up the user's FCM token from UserProfile
    and calls send_push(). No-op if the user has no registered token.
    """
    try:
        from users.models import UserProfile
        profile = UserProfile.objects.get(user=user)
        if profile.fcm_token:
            send_push(fcm_token=profile.fcm_token, title=title, body=body, data=data)
    except Exception as exc:
        logger.warning("send_push_to_user failed for user_id=%s: %s", getattr(user, 'id', '?'), exc)
