import os

from django.core import signing
from django.utils.crypto import constant_time_compare
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.throttling import ScopedRateThrottle

# Admin accounts are configured on the server only — never in the app bundle.
#   ADMIN_EMAILS=a@nexum.com,b@nexum.com
#   ADMIN_PASSWORD=<strong password>
_TOKEN_SALT    = 'nexum.admin'
_TOKEN_MAX_AGE = 60 * 60 * 24 * 7   # 7 days


def _admin_emails():
    return {
        e.strip().lower()
        for e in os.getenv('ADMIN_EMAILS', '').split(',')
        if e.strip()
    }


def is_admin(request):
    """True if the request carries a valid, unexpired admin token (X-Admin-Token)."""
    token = request.headers.get('X-Admin-Token', '')
    if not token:
        return False
    try:
        email = signing.loads(token, salt=_TOKEN_SALT, max_age=_TOKEN_MAX_AGE)
    except signing.BadSignature:
        return False
    return email in _admin_emails()


class AdminLoginView(APIView):
    """
    POST /api/users/admin/login/   { email, password }
    Response: { token, email }
    """
    authentication_classes = []
    permission_classes     = [AllowAny]
    throttle_classes       = [ScopedRateThrottle]
    throttle_scope         = 'auth'

    def post(self, request):
        email    = str(request.data.get('email', '')).strip().lower()
        password = str(request.data.get('password', ''))
        expected = os.getenv('ADMIN_PASSWORD', '')

        if not expected or email not in _admin_emails() or not constant_time_compare(password, expected):
            return Response({'detail': 'Invalid admin credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        token = signing.dumps(email, salt=_TOKEN_SALT)
        return Response({'token': token, 'email': email})
