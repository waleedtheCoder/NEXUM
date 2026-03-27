import json
import os
import random
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

from .models import UserProfile
from .serializers import ProfileResponseSerializer, ProfileUpdateSerializer


def _build_profile_payload(user, profile):
    return {
        'uid': profile.firebase_uid,
        'email': user.email or '',
        'name': user.first_name or '',
        'role': profile.role,
        'phone_number': profile.phone_number,
        'email_verified': profile.email_verified,
    }


ROLE_MAP = {
    '1': 'SHOPKEEPER',
    '2': 'SUPPLIER',
    'shopkeeper': 'SHOPKEEPER',
    'supplier': 'SUPPLIER',
    'customer': 'CUSTOMER',
    'SHOPKEEPER': 'SHOPKEEPER',
    'SUPPLIER': 'SUPPLIER',
    'CUSTOMER': 'CUSTOMER',
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
    return f"{random.randint(0, 9999):04d}"


def _create_session_id(user):
    session = SessionStore()
    session['user_id'] = user.id
    session['email'] = user.email or ''
    session.save()
    return session.session_key


def _build_otp_response(payload, otp):
    response = dict(payload)
    # Keep OTP visible only in development for easier local testing.
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

    from_email = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@nexum.local')
    send_mail(subject, body, from_email, [email], fail_silently=False)


def _post_json(url, payload):
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode('utf-8'))


def _extract_firebase_error_code(raw_body):
    try:
        parsed = json.loads(raw_body)
    except Exception:
        return ''

    return str(parsed.get('error', {}).get('message', '')).strip().upper()


def _firebase_sign_in(email, password):
    api_key = os.getenv('FIREBASE_WEB_API_KEY', '').strip()
    if not api_key:
        raise RuntimeError('Missing FIREBASE_WEB_API_KEY in backend/.env')

    url = f'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}'
    try:
        result = _post_json(
            url,
            {
                'email': email,
                'password': password,
                'returnSecureToken': True,
            },
        )
    except urllib.error.HTTPError as exc:
        body = exc.read().decode('utf-8', errors='ignore')
        firebase_code = _extract_firebase_error_code(body)

        if firebase_code in {'INVALID_LOGIN_CREDENTIALS', 'EMAIL_NOT_FOUND', 'INVALID_PASSWORD'}:
            raise RuntimeError('Invalid email or password.') from exc
        if firebase_code == 'USER_DISABLED':
            raise RuntimeError('This Firebase account is disabled.') from exc

        raise RuntimeError(f'Firebase sign-in failed: {body or str(exc)}') from exc

    id_token = result.get('idToken')
    local_id = result.get('localId')
    refresh_token = result.get('refreshToken')
    if not id_token or not local_id:
        raise RuntimeError('Firebase sign-in response missing idToken/localId.')

    return {
        'id_token': id_token,
        'refresh_token': refresh_token,
        'uid': local_id,
    }


def _sync_local_user_from_firebase(uid, email, name='', role=None, email_verified=False):
    normalized_role = _normalize_role(role) if role is not None else None

    user, _ = User.objects.get_or_create(
        username=uid,
        defaults={
            'email': email,
            'first_name': name or '',
        },
    )

    user_updates = []
    if email and user.email != email:
        user.email = email
        user_updates.append('email')
    if name and user.first_name != name:
        user.first_name = name
        user_updates.append('first_name')
    if user_updates:
        user.save(update_fields=user_updates)

    profile, created = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'firebase_uid': uid,
            'role': normalized_role or 'CUSTOMER',
            'email_verified': bool(email_verified),
        },
    )

    if not created:
        update_fields = []
        if profile.firebase_uid != uid:
            profile.firebase_uid = uid
            update_fields.append('firebase_uid')
        if normalized_role is not None and profile.role != normalized_role:
            profile.role = normalized_role
            update_fields.append('role')
        if profile.email_verified != bool(email_verified):
            profile.email_verified = bool(email_verified)
            update_fields.append('email_verified')
        if update_fields:
            profile.save(update_fields=update_fields)

    return user, profile


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get('email', '')).strip().lower()
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
        payload = _build_profile_payload(user, profile)
        return Response(
            {
                'session_id': session_id,
                'id_token': token_data['id_token'],
                'refresh_token': token_data.get('refresh_token'),
                'user': payload,
            },
            status=status.HTTP_200_OK,
        )


class SignupView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        name = str(request.data.get('name', '')).strip()
        email = str(request.data.get('email', '')).strip().lower()
        password = str(request.data.get('password', ''))
        role = request.data.get('role', 'CUSTOMER')

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

        # Prevent re-registering existing Firebase users.
        try:
            auth.get_user_by_email(email)
            return Response({'detail': 'Email already registered.'}, status=status.HTTP_409_CONFLICT)
        except auth.UserNotFoundError:
            pass

        otp = _generate_otp()
        cache.set(_otp_cache_key(email, 'signup'), otp, timeout=10 * 60)
        cache.set(
            _signup_pending_cache_key(email),
            {
                'name': name,
                'email': email,
                'password': password,
                'role': _normalize_role(role),
            },
            timeout=10 * 60,
        )

        try:
            _send_otp_email(email, otp, flow='signup')
        except Exception as exc:
            return Response({'detail': f'Could not send OTP email: {str(exc)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(
            _build_otp_response(
                {
                'message': 'Signup successful. Verify OTP to continue.',
                'flow': 'signup',
                'email': email,
                },
                otp,
            ),
            status=status.HTTP_201_CREATED,
        )


class VerifyOtpView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get('email', '')).strip().lower()
        flow = str(request.data.get('flow', '')).strip().lower()
        otp = str(request.data.get('otp', '')).strip()

        if flow not in {'signup', 'reset'}:
            return Response({'detail': 'Flow must be signup or reset.'}, status=status.HTTP_400_BAD_REQUEST)

        expected = cache.get(_otp_cache_key(email, flow))
        if not expected or otp != expected:
            return Response({'detail': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        if flow == 'signup':
            pending = cache.get(_signup_pending_cache_key(email))
            if not pending:
                return Response({'detail': 'Signup request expired. Please sign up again.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                firebase_user = auth.create_user(
                    email=pending['email'],
                    password=pending['password'],
                    display_name=pending.get('name') or '',
                    email_verified=True,
                )
            except auth.EmailAlreadyExistsError:
                return Response({'detail': 'Email already registered.'}, status=status.HTTP_409_CONFLICT)
            except Exception as exc:
                return Response({'detail': f'Failed to create Firebase user: {str(exc)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            payload = _build_profile_payload(user, profile)
            return Response(
                {
                    'session_id': session_id,
                    'id_token': token_data['id_token'],
                    'refresh_token': token_data.get('refresh_token'),
                    'user': payload,
                },
                status=status.HTTP_200_OK,
            )

        cache.delete(_otp_cache_key(email, 'reset'))
        return Response({'message': 'OTP verified for password reset.'}, status=status.HTTP_200_OK)


class ForgotPasswordView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get('email', '')).strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

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
                return Response({'detail': f'Could not send OTP email: {str(exc)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            otp = None

        # Intentional generic response to avoid account enumeration.
        return Response(
            _build_otp_response(
                {
                'message': 'If this email exists, an OTP has been generated.',
                'flow': 'reset',
                },
                otp,
            ),
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get('email', '')).strip().lower()
        otp = str(request.data.get('otp', '')).strip()
        new_password = str(request.data.get('new_password', ''))

        if not email or not otp or not new_password:
            return Response(
                {'detail': 'Email, otp and new_password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {'detail': 'New password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expected = cache.get(_otp_cache_key(email, 'reset'))
        if not expected or otp != expected:
            return Response({'detail': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            firebase_user = auth.get_user_by_email(email)
        except auth.UserNotFoundError:
            return Response({'detail': 'User not found for this email.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            auth.update_user(firebase_user.uid, password=new_password)
        except Exception as exc:
            return Response({'detail': f'Failed to reset Firebase password: {str(exc)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        cache.delete(_otp_cache_key(email, 'reset'))

        return Response({'message': 'Password reset successful.'}, status=status.HTTP_200_OK)


class AuthSessionView(APIView):
    def get(self, request):
        profile = request.user.profile
        payload = _build_profile_payload(request.user, profile)
        serializer = ProfileResponseSerializer(payload)
        return Response(serializer.data, status=status.HTTP_200_OK)

class UserOnboardingView(APIView):
    def get(self, request):
        profile = request.user.profile
        payload = _build_profile_payload(request.user, profile)
        serializer = ProfileResponseSerializer(payload)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        profile = request.user.profile

        serializer = ProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        name = serializer.validated_data.get('name')
        role = serializer.validated_data.get('role')

        if name is not None:
            request.user.first_name = name
            request.user.save(update_fields=['first_name'])

        if role is not None:
            profile.role = role

        profile.save()

        payload = _build_profile_payload(request.user, profile)
        response_serializer = ProfileResponseSerializer(payload)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # Keep POST for compatibility with existing frontend assumptions.
        return self.patch(request)
