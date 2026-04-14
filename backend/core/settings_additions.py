# ─────────────────────────────────────────────────────────────────────────────
# core/settings_additions.py
#
# These blocks REPLACE or ADD TO the corresponding sections in core/settings.py.
# Each section is labelled. Do not paste the whole file — merge the relevant
# block into the matching location in your existing settings.py.
# ─────────────────────────────────────────────────────────────────────────────


# ── 6. Pagination ─────────────────────────────────────────────────────────────
# ADD inside the existing REST_FRAMEWORK dict.
# Adds PageNumberPagination to every list endpoint automatically.

REST_FRAMEWORK = {
    # ... keep your existing authentication + permission keys ...
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'users.authentication.SessionIDAuthentication',
        'users.authentication.FirebaseAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),

    # ↓↓↓  NEW — Pagination  ↓↓↓
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,

    # ↓↓↓  NEW — Throttling (rate limiting on ALL endpoints)  ↓↓↓
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/minute',
        'user': '200/minute',
        # Auth-specific scoped throttle (see users/views.py AuthThrottle)
        'auth': '10/minute',
    },
}

# Frontend pagination response shape:
# {
#     "count":    142,
#     "next":     "http://.../api/listings/?page=2",
#     "previous": null,
#     "results":  [ ...listing objects... ]
# }
# Frontend FlatList screens need onEndReached → fetch next page URL.


# ── 10. Rate limiting — auth endpoints ────────────────────────────────────────
# In users/views.py, add this throttle class above the views that need it:

# class AuthRateThrottle(UserRateThrottle):
#     scope = 'auth'
#
# class SignupView(APIView):
#     throttle_classes = [AuthRateThrottle]
#     ...
#
# class LoginView(APIView):
#     throttle_classes = [AuthRateThrottle]
#     ...
#
# class ForgotPasswordView(APIView):
#     throttle_classes = [AuthRateThrottle]
#     ...


# ── 11. OTP security — replace in-memory dict + random.randint ───────────────
# In users/views.py, REPLACE the OTP generation + storage with:

# import secrets
# from django.core.cache import cache
#
# OTP_TTL = 600   # 10 minutes
#
# def _generate_otp() -> str:
#     """Cryptographically secure 6-digit OTP."""
#     return str(secrets.randbelow(900000) + 100000)
#
# def _store_otp(email: str, otp: str):
#     """
#     Store OTP in Django cache.
#     In development: LocMemCache (per-process, fine for single worker).
#     In production: set CACHES to use Redis so all gunicorn workers share it.
#     """
#     cache.set(f"otp:{email}", otp, timeout=OTP_TTL)
#
# def _verify_otp(email: str, otp: str) -> bool:
#     stored = cache.get(f"otp:{email}")
#     if stored and stored == otp:
#         cache.delete(f"otp:{email}")   # single-use
#         return True
#     return False


# ── 12. CORS — restrict to app origins ───────────────────────────────────────
# REPLACE the existing CORS block:

import os

# Development: allow local metro bundler + LAN IP
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8081",           # Expo Metro bundler
    "http://127.0.0.1:8081",
    f"http://{os.getenv('LAN_IP', '192.168.1.100')}:8081",
]

# Production: restrict to your domain
if not os.getenv('DJANGO_DEBUG', 'True') == 'True':
    CORS_ALLOWED_ORIGINS = [
        "https://nexum.app",           # replace with your real domain
    ]

# DELETE this line if it exists in your settings.py:
# CORS_ALLOW_ALL_ORIGINS = True


# ── 8. Django Channels (WebSocket) ────────────────────────────────────────────
# ADD to INSTALLED_APPS (daphne must come FIRST):
INSTALLED_APPS = [
    'daphne',              # MUST be first — overrides runserver with ASGI
    # ... your existing apps ...
    'channels',
    'orders',
    'promotions',
]

# ADD channel layer config (requires Redis in production):
CHANNEL_LAYERS = {
    'default': {
        # Development — in-memory, single process only
        'BACKEND': 'channels.layers.InMemoryChannelLayer',

        # Production — uncomment and set REDIS_URL env var:
        # 'BACKEND': 'channels_redis.core.RedisChannelLayer',
        # 'CONFIG': {'hosts': [os.getenv('REDIS_URL', 'redis://localhost:6379')]},
    }
}

# Tell Django to use ASGI (required for Channels):
ASGI_APPLICATION = 'core.asgi.application'


# ── 7. Media file storage (image uploads) ─────────────────────────────────────
# ADD for local development:
MEDIA_URL  = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# In core/urls.py, ADD at the bottom (development only):
# from django.conf import settings
# from django.conf.urls.static import static
# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Production — swap to S3:
# pip install django-storages boto3
# DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
# AWS_STORAGE_BUCKET_NAME = os.getenv('S3_BUCKET')
# AWS_S3_REGION_NAME      = os.getenv('AWS_REGION', 'ap-south-1')


# ── 9. FCM token field — add to UserProfile model ────────────────────────────
# In users/models.py, ADD this field to UserProfile:
#
# class UserProfile(models.Model):
#     ...
#     fcm_token = models.CharField(max_length=500, blank=True, default='')
#
# Then add this endpoint so the app can register its token on login:
# POST /api/users/fcm-token/   { "fcm_token": "<device_token>" }
#
# In users/views.py:
#
# class RegisterFCMTokenView(APIView):
#     def post(self, request):
#         token = request.data.get('fcm_token', '').strip()
#         if token:
#             UserProfile.objects.filter(user=request.user).update(fcm_token=token)
#         return Response({'detail': 'FCM token registered.'})
#
# In users/urls.py:
#     path('fcm-token/', RegisterFCMTokenView.as_view()),


# ── core/urls.py — ADD new app routes ────────────────────────────────────────
# In core/urls.py, add inside urlpatterns:
#
# path('api/orders/',      include('orders.urls')),
# path('api/promotions/',  include('promotions.urls')),
# path('api/users/supplier/<int:supplier_id>/', SupplierPublicProfileView.as_view()),
#
# The listings and users paths already exist — just add the new views
# to their existing url files (see listings_additions/urls_additions.py).


# ── .env additions ────────────────────────────────────────────────────────────
# Add to backend/.env:
#
# LAN_IP=192.168.x.x
# REDIS_URL=redis://localhost:6379        # for prod channel layer + cache
# S3_BUCKET=nexum-media                  # for prod image storage
# AWS_REGION=ap-south-1
