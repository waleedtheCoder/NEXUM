import json
import os
import secrets
import urllib.error
import urllib.request

from django.contrib.auth.models import User
from django.contrib.sessions.backends.db import SessionStore
from django.core.mail import send_mail
from django.core.cache import cache
from firebase_admin import auth
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.throttling import UserRateThrottle

from .models import UserProfile
from .serializers import ProfileResponseSerializer, ProfileUpdateSerializer


# ── Throttle ──────────────────────────────────────────────────────────────────

class AuthRateThrottle(UserRateThrottle):
    """Limits login / signup / forgot-password to 10 requests/minute per user."""
    scope = 'auth'


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_profile_payload(user, profile):
    return {
        'uid':               profile.firebase_uid,
        'email':             user.email or '',
        'name':              user.first_name or '',
        'role':              profile.role,
        'phone_number':      profile.phone_number,
        'email_verified':    profile.email_verified,
        'profile_image_url': profile.profile_image_url or '',
    }


ROLE_MAP = {
    '1': 'SHOPKEEPER', '2': 'SUPPLIER',
    'shopkeeper': 'SHOPKEEPER', 'supplier': 'SUPPLIER', 'customer': 'CUSTOMER',
    'SHOPKEEPER': 'SHOPKEEPER', 'SUPPLIER': 'SUPPLIER', 'CUSTOMER': 'CUSTOMER',
}


def _normalize_role(role):
    if not role:
        return 'CUSTOMER'
    return ROLE_MAP.get(str(role).strip(), 'CUSTOMER')


def _otp_cache_key(email, flow):
    return f'auth:otp:{flow}:{str(email).strip().lower()}'


def _signup_pending_cache_key(email):
    return f'auth:signup:pending:{str(email).strip().lower()}'


def _generate_otp():
    # secrets module — cryptographically secure
    return f'{secrets.randbelow(10000):04d}'


def _create_session_id(user):
    session = SessionStore()
    session['user_id'] = user.id
    session['email']   = user.email or ''
    session.save()
    return session.session_key


def _build_otp_response(payload, otp):
    response = dict(payload)
    if os.getenv('DJANGO_DEBUG', '').strip().lower() in {'1', 'true', 'yes', 'on'}:
        response['otp_debug'] = otp
    return response


def _send_otp_email(email, otp, flow):
    flow_label = 'Signup Verification' if flow == 'signup' else 'Password Reset'
    subject = f'NEXUM {flow_label} OTP'
    body = (
        f'Your NEXUM OTP is {otp}.\n\n'
        'This code expires in 10 minutes.\n'
        'If you did not request this, you can ignore this email.'
    )
    send_mail(subject, body, None, [email], fail_silently=False)


def _firebase_sign_in(email, password):
    api_key = os.getenv('FIREBASE_WEB_API_KEY', '')
    if not api_key:
        raise RuntimeError('FIREBASE_WEB_API_KEY is not configured.')

    url  = f'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}'
    body = json.dumps({
        'email': email, 'password': password, 'returnSecureToken': True,
    }).encode()

    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        error_body = json.loads(exc.read())
        message    = error_body.get('error', {}).get('message', '')
        raise RuntimeError(_firebase_error_message(message))

    return {
        'id_token':      data.get('idToken'),
        'refresh_token': data.get('refreshToken'),
        'uid':           data.get('localId'),
    }


def _firebase_refresh_token(refresh_token):
    api_key = os.getenv('FIREBASE_WEB_API_KEY', '')
    if not api_key:
        raise RuntimeError('FIREBASE_WEB_API_KEY is not configured.')

    url  = f'https://securetoken.googleapis.com/v1/token?key={api_key}'
    body = json.dumps({
        'grant_type': 'refresh_token', 'refresh_token': refresh_token,
    }).encode()

    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        error_body = json.loads(exc.read())
        message    = error_body.get('error', {}).get('message', '')
        raise RuntimeError(f'Token refresh failed: {message}')

    return {
        'id_token':      data.get('id_token'),
        'refresh_token': data.get('refresh_token'),
    }


def _firebase_error_message(message):
    return {
        'EMAIL_NOT_FOUND':   'No account found with this email.',
        'INVALID_PASSWORD':  'Incorrect password.',
        'USER_DISABLED':     'This account has been disabled.',
        'INVALID_LOGIN_CREDENTIALS':       'Invalid email or password.',
        'TOO_MANY_ATTEMPTS_TRY_LATER':     'Too many failed attempts. Please try again later.',
    }.get(message, f'Authentication failed: {message}')


def _sync_local_user_from_firebase(uid, email, name='', role='CUSTOMER', email_verified=False):
    user, _ = User.objects.get_or_create(
        username=uid, defaults={'email': email, 'first_name': name}
    )
    if email and user.email != email:
        user.email = email
        user.save(update_fields=['email'])
    if name and user.first_name != name:
        user.first_name = name
        user.save(update_fields=['first_name'])

    profile, created = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'firebase_uid':   uid,
            'role':           _normalize_role(role),
            'email_verified': email_verified,
        },
    )
    if not created:
        update_fields = []
        if profile.email_verified != email_verified:
            profile.email_verified = email_verified
            update_fields.append('email_verified')
        if update_fields:
            profile.save(update_fields=update_fields)

    return user, profile


# ── Views ─────────────────────────────────────────────────────────────────────

class LoginView(APIView):
    authentication_classes = []
    permission_classes     = [AllowAny]
    throttle_classes       = [AuthRateThrottle]

    def post(self, request):
        email    = str(request.data.get('email', '')).strip().lower()
        password = str(request.data.get('password', ''))

        if not email or not password:
            return Response(
                {'detail': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token_data = _firebase_sign_in(email, password)
        except RuntimeError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            firebase_user = auth.get_user(token_data['uid'])
        except auth.UserNotFoundError:
            return Response({'detail': 'Firebase user not found.'}, status=status.HTTP_404_NOT_FOUND)

        role_hint = request.data.get('role')
        user, profile = _sync_local_user_from_firebase(
            uid=firebase_user.uid,
            email=firebase_user.email or email,
            name=firebase_user.display_name or '',
            role=role_hint or 'CUSTOMER',
            email_verified=bool(firebase_user.email_verified),
        )

        if not profile.email_verified:
            return Response(
                {'detail': 'Email is not verified yet. Please verify OTP first.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        session_id = _create_session_id(user)
        payload    = _build_profile_payload(user, profile)
        return Response(
            {
                'session_id':    session_id,
                'id_token':      token_data['id_token'],
                'refresh_token': token_data.get('refresh_token'),
                'user':          payload,
            },
            status=status.HTTP_200_OK,
        )


class SignupView(APIView):
    authentication_classes = []
    permission_classes     = [AllowAny]
    throttle_classes       = [AuthRateThrottle]

    def post(self, request):
        name     = str(request.data.get('name', '')).strip()
        email    = str(request.data.get('email', '')).strip().lower()
        password = str(request.data.get('password', ''))
        role     = request.data.get('role', 'CUSTOMER')

        if not name or not email or not password:
            return Response(
                {'detail': 'Name, email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(password) < 8:
            return Response(
                {'detail': 'Password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            auth.get_user_by_email(email)
            return Response({'detail': 'Email already registered.'}, status=status.HTTP_409_CONFLICT)
        except auth.UserNotFoundError:
            pass

        otp = _generate_otp()
        cache.set(_otp_cache_key(email, 'signup'), otp, timeout=10 * 60)
        cache.set(
            _signup_pending_cache_key(email),
            {'name': name, 'email': email, 'password': password, 'role': _normalize_role(role)},
            timeout=10 * 60,
        )
        try:
            _send_otp_email(email, otp, flow='signup')
        except Exception as exc:
            return Response(
                {'detail': f'Could not send OTP email: {str(exc)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(
            _build_otp_response(
                {'message': 'Signup successful. Verify OTP to continue.', 'flow': 'signup', 'email': email},
                otp,
            ),
            status=status.HTTP_201_CREATED,
        )


class VerifyOtpView(APIView):
    authentication_classes = []
    permission_classes     = [AllowAny]

    def post(self, request):
        email = str(request.data.get('email', '')).strip().lower()
        flow  = str(request.data.get('flow', '')).strip().lower()
        otp   = str(request.data.get('otp', '')).strip()

        if flow not in {'signup', 'reset'}:
            return Response(
                {'detail': 'Flow must be signup or reset.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expected = cache.get(_otp_cache_key(email, flow))
        if not expected or otp != expected:
            return Response(
                {'detail': 'Invalid or expired OTP.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if flow == 'signup':
            pending = cache.get(_signup_pending_cache_key(email))
            if not pending:
                return Response(
                    {'detail': 'Signup request expired. Please sign up again.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                firebase_user = auth.create_user(
                    email=pending['email'],
                    password=pending['password'],
                    display_name=pending.get('name') or '',
                    email_verified=True,
                )
            except auth.EmailAlreadyExistsError:
                return Response(
                    {'detail': 'Email already registered.'},
                    status=status.HTTP_409_CONFLICT,
                )
            except Exception as exc:
                return Response(
                    {'detail': f'Failed to create Firebase user: {str(exc)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            try:
                token_data = _firebase_sign_in(pending['email'], pending['password'])
            except RuntimeError as exc:
                return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            user, profile = _sync_local_user_from_firebase(
                uid=firebase_user.uid,
                email=pending['email'],
                name=pending.get('name') or '',
                role=pending.get('role') or 'CUSTOMER',
                email_verified=True,
            )
            cache.delete(_otp_cache_key(email, 'signup'))
            cache.delete(_signup_pending_cache_key(email))
            session_id = _create_session_id(user)
            payload    = _build_profile_payload(user, profile)
            return Response(
                {
                    'session_id':    session_id,
                    'id_token':      token_data['id_token'],
                    'refresh_token': token_data.get('refresh_token'),
                    'user':          payload,
                },
                status=status.HTTP_200_OK,
            )

        # flow == 'reset'
        cache.delete(_otp_cache_key(email, 'reset'))
        return Response({'message': 'OTP verified for password reset.'}, status=status.HTTP_200_OK)


class ForgotPasswordView(APIView):
    authentication_classes = []
    permission_classes     = [AllowAny]
    throttle_classes       = [AuthRateThrottle]

    def post(self, request):
        email = str(request.data.get('email', '')).strip().lower()
        if not email:
            return Response(
                {'detail': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_exists = True
        try:
            auth.get_user_by_email(email)
        except auth.UserNotFoundError:
            user_exists = False

        if user_exists:
            otp = _generate_otp()
            cache.set(_otp_cache_key(email, 'reset'), otp, timeout=10 * 60)
            try:
                _send_otp_email(email, otp, flow='reset')
            except Exception as exc:
                return Response(
                    {'detail': f'Could not send OTP email: {str(exc)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        else:
            otp = None

        # Generic response to avoid account enumeration
        return Response(
            _build_otp_response(
                {'message': 'If that email is registered, you will receive an OTP shortly.'},
                otp,
            ),
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    authentication_classes = []
    permission_classes     = [AllowAny]

    def post(self, request):
        email        = str(request.data.get('email', '')).strip().lower()
        otp          = str(request.data.get('otp', '')).strip()
        new_password = str(request.data.get('new_password', ''))

        if not email or not otp or not new_password:
            return Response(
                {'detail': 'Email, OTP and new_password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(new_password) < 8:
            return Response(
                {'detail': 'Password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expected = cache.get(_otp_cache_key(email, 'reset'))
        if not expected or otp != expected:
            return Response(
                {'detail': 'Invalid or expired OTP.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            firebase_user = auth.get_user_by_email(email)
        except auth.UserNotFoundError:
            return Response(
                {'detail': 'No account found with this email.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            auth.update_user(firebase_user.uid, password=new_password)
        except Exception as exc:
            return Response(
                {'detail': f'Failed to reset Firebase password: {str(exc)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        cache.delete(_otp_cache_key(email, 'reset'))
        return Response({'message': 'Password reset successful.'}, status=status.HTTP_200_OK)


class AuthSessionView(APIView):
    def get(self, request):
        profile    = request.user.profile
        payload    = _build_profile_payload(request.user, profile)
        serializer = ProfileResponseSerializer(payload)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserOnboardingView(APIView):
    def get(self, request):
        profile    = request.user.profile
        payload    = _build_profile_payload(request.user, profile)
        serializer = ProfileResponseSerializer(payload)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        profile    = request.user.profile
        serializer = ProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        name              = serializer.validated_data.get('name')
        role              = serializer.validated_data.get('role')
        phone_number      = serializer.validated_data.get('phone_number')
        profile_image_url = serializer.validated_data.get('profile_image_url')

        if name is not None:
            request.user.first_name = name
            request.user.save(update_fields=['first_name'])

        profile_update_fields = []
        if role is not None:
            profile.role = role
            profile_update_fields.append('role')
        if phone_number is not None:
            profile.phone_number = phone_number
            profile_update_fields.append('phone_number')
        if profile_image_url is not None:
            profile.profile_image_url = profile_image_url
            profile_update_fields.append('profile_image_url')

        if profile_update_fields:
            profile.save(update_fields=profile_update_fields)
        else:
            profile.save()

        payload             = _build_profile_payload(request.user, profile)
        response_serializer = ProfileResponseSerializer(payload)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # Keep POST for compatibility with existing frontend
        return self.patch(request)


class TokenRefreshView(APIView):
    """
    POST /api/users/auth/token-refresh/
    Exchanges a Firebase refresh_token for a fresh id_token.
    Body:     { "refresh_token": "<firebase_refresh_token>" }
    Response: { "id_token": "...", "refresh_token": "..." }
    """
    authentication_classes = []
    permission_classes     = [AllowAny]

    def post(self, request):
        refresh_token = str(request.data.get('refresh_token', '')).strip()
        if not refresh_token:
            return Response(
                {'detail': 'refresh_token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            tokens = _firebase_refresh_token(refresh_token)
        except RuntimeError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(tokens, status=status.HTTP_200_OK)