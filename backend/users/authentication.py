import firebase_admin
from django.contrib.sessions.models import Session
from django.core.cache import cache
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from firebase_admin import auth
from django.contrib.auth.models import User

from .models import UserProfile

# How long to hold the session_id → user_id mapping in cache.
# Sessions themselves can live much longer; this just controls how often we
# re-verify by hitting the Session table. 5 minutes is safe.
_SESSION_CACHE_TTL = 300


def session_cache_key(session_id: str) -> str:
    return f'sid:{session_id}'


class SessionIDAuthentication(BaseAuthentication):
    def authenticate(self, request):
        session_id = request.META.get('HTTP_X_SESSION_ID', '').strip()

        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not session_id and auth_header:
            parts = auth_header.split(' ')
            if len(parts) == 2 and parts[0].lower() == 'session' and parts[1]:
                session_id = parts[1].strip()

        if not session_id:
            return None

        # ── Cache look-up (avoids a Session DB query on every request) ────────
        cache_key = session_cache_key(session_id)
        user_id   = cache.get(cache_key)

        if user_id is None:
            # Cache miss — verify against the DB and populate the cache.
            try:
                session = Session.objects.get(
                    session_key=session_id,
                    expire_date__gte=timezone.now(),
                )
            except Session.DoesNotExist as exc:
                raise AuthenticationFailed('Invalid or expired session ID.') from exc

            session_data = session.get_decoded()
            user_id      = session_data.get('user_id')

            if not user_id:
                # Anonymous guest session — not authenticated, but not an error.
                return None

            cache.set(cache_key, user_id, timeout=_SESSION_CACHE_TTL)

        # ── Single JOIN query: User + profile together ────────────────────────
        # select_related('profile') means request.user.profile in any view is
        # free — no extra DB round trip.
        try:
            user = User.objects.select_related('profile').get(id=user_id)
        except User.DoesNotExist as exc:
            cache.delete(cache_key)
            raise AuthenticationFailed('User for this session does not exist.') from exc

        return (user, None)


class FirebaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None

        parts = auth_header.split(' ')
        if len(parts) != 2 or parts[0].lower() != 'bearer' or not parts[1]:
            raise AuthenticationFailed('Invalid token header format. Use "Bearer <token>"')
        token = parts[1]

        try:
            firebase_admin.get_app()
        except ValueError as exc:
            raise AuthenticationFailed(
                'Firebase Admin SDK is not initialized. Configure FIREBASE_CREDENTIALS_PATH.'
            ) from exc

        try:
            decoded_token  = auth.verify_id_token(token)
            uid            = decoded_token.get('uid')
            email          = decoded_token.get('email', f"{uid}@firebase.local")
            phone          = decoded_token.get('phone_number', '')
            email_verified = bool(decoded_token.get('email_verified', False))
        except Exception as e:
            raise AuthenticationFailed(f'Invalid or expired Firebase ID Token: {str(e)}')

        if not uid:
            raise AuthenticationFailed('Invalid Firebase token payload: uid is missing.')

        # Single JOIN: fetch User + profile together so views don't need a
        # second query for request.user.profile.
        user, _ = User.objects.select_related('profile').get_or_create(
            username=uid, defaults={'email': email}
        )

        if email and user.email != email:
            user.email = email
            user.save(update_fields=['email'])

        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'firebase_uid':   uid,
                'phone_number':   phone,
                'email_verified': email_verified,
            }
        )

        if not created:
            update_fields = []
            if profile.phone_number != phone:
                profile.phone_number = phone
                update_fields.append('phone_number')
            if profile.email_verified != email_verified:
                profile.email_verified = email_verified
                update_fields.append('email_verified')
            if update_fields:
                profile.save(update_fields=update_fields)

        return (user, None)
