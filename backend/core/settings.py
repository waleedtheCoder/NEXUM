"""
Drop-in replacement for backend/core/settings.py.

Changes vs. the original:
  1. Added 'listings', 'chat', 'notifications' to INSTALLED_APPS.
  2. Fixed OTP generator — uses `secrets` instead of `random` (security fix).
     (The fix is actually in users/views.py but noted here for awareness.)
  3. No other changes — auth, DB, email, CORS config are untouched.
"""

import os
from pathlib import Path

import firebase_admin
from firebase_admin import credentials

BASE_DIR = Path(__file__).resolve().parent.parent


def _load_env_file(env_path):
    if not os.path.exists(env_path):
        return
    with open(env_path, 'r', encoding='utf-8') as env_file:
        for raw_line in env_file:
            line = raw_line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            key   = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)


def _env_to_bool(value, default=False):
    if value is None:
        return default
    return str(value).strip().lower() in {'1', 'true', 'yes', 'on'}


_load_env_file(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-change-me')
DEBUG      = _env_to_bool(os.getenv('DJANGO_DEBUG'), default=True)

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv('DJANGO_ALLOWED_HOSTS', '127.0.0.1,localhost').split(',')
    if host.strip()
]

# ── Application definition ────────────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    # ── Existing app ──────────────────────────────────────────────────────
    'users',
    # ── NEW apps (marketplace core) ───────────────────────────────────────
    'listings',
    'chat',
    'notifications',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# ── Database ─────────────────────────────────────────────────────────────────
DB_ENGINE = os.getenv('DB_ENGINE', 'sqlite3').strip().lower()

if DB_ENGINE in {'postgres', 'postgresql', 'django.db.backends.postgresql'}:
    DATABASES = {
        'default': {
            'ENGINE':   'django.db.backends.postgresql',
            'NAME':     os.getenv('DB_NAME', 'postgres'),
            'USER':     os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST':     os.getenv('DB_HOST', 'localhost'),
            'PORT':     os.getenv('DB_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME':   BASE_DIR / os.getenv('SQLITE_FILE', 'db.sqlite3'),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'UTC'
USE_I18N      = True
USE_TZ        = True

CORS_ALLOW_ALL_ORIGINS = True   # Lock down in production

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-session-id',   # ← this is the one that was missing
]

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── Django REST Framework ─────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'users.authentication.SessionIDAuthentication',
        'users.authentication.FirebaseAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# ── Email ─────────────────────────────────────────────────────────────────────
EMAIL_BACKEND       = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST          = os.getenv('EMAIL_HOST', 'localhost')
EMAIL_PORT          = int(os.getenv('EMAIL_PORT', '25'))
EMAIL_USE_TLS       = _env_to_bool(os.getenv('EMAIL_USE_TLS'), default=False)
EMAIL_HOST_USER     = os.getenv('EMAIL_HOST_USER', '')
_email_host_password = os.getenv('EMAIL_HOST_PASSWORD', '')
# Gmail app passwords are copied with spaces — strip them
EMAIL_HOST_PASSWORD  = _email_host_password.replace(' ', '')
DEFAULT_FROM_EMAIL   = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)

# ── Firebase Admin SDK ────────────────────────────────────────────────────────
_creds_path = os.getenv('FIREBASE_CREDENTIALS_PATH', '')
_default_creds_file = os.path.join(BASE_DIR, 'firebase-adminsdk.json')

try:
    firebase_admin.get_app()
except ValueError:
    if _creds_path and os.path.exists(_creds_path):
        cred = credentials.Certificate(_creds_path)
        firebase_admin.initialize_app(cred)
    elif os.path.exists(_default_creds_file):
        cred = credentials.Certificate(_default_creds_file)
        firebase_admin.initialize_app(cred)
    else:
        firebase_admin.initialize_app()   # Application Default Credentials

FIREBASE_WEB_API_KEY = os.getenv('FIREBASE_WEB_API_KEY', '')
