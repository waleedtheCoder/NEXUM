import getpass
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

import django
import firebase_admin
from firebase_admin import auth


def _bootstrap_django():
    # Ensure project root (backend/) is importable even if script is run from backend/scripts.
    project_root = Path(__file__).resolve().parent.parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    django.setup()


def _validate_inputs(email, password):
    if not email or '@' not in email:
        raise ValueError('Please provide a valid email address.')

    if not password or len(password) < 6:
        raise ValueError('Password must be at least 6 characters long (Firebase minimum).')


def _ensure_firebase_initialized():
    try:
        firebase_admin.get_app()
    except ValueError as exc:
        raise RuntimeError(
            'Firebase Admin SDK is not initialized. Check FIREBASE_CREDENTIALS_PATH in backend/.env.'
        ) from exc


def _create_firebase_user(email, password):
    try:
        return auth.create_user(email=email, password=password)
    except auth.EmailAlreadyExistsError as exc:
        raise RuntimeError('A Firebase user with this email already exists.') from exc


def _post_json(url, payload):
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode('utf-8'))


def _send_verification_email_with_firebase(email, password):
    api_key = os.getenv('FIREBASE_WEB_API_KEY', '').strip()
    if not api_key:
        raise RuntimeError(
            'Missing FIREBASE_WEB_API_KEY. Set it in backend/.env to auto-send verification email.'
        )

    sign_in_url = f'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}'
    send_oob_url = f'https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={api_key}'

    try:
        sign_in_data = _post_json(
            sign_in_url,
            {
                'email': email,
                'password': password,
                'returnSecureToken': True,
            },
        )
        id_token = sign_in_data.get('idToken')
        if not id_token:
            raise RuntimeError('Firebase sign-in did not return idToken for verification flow.')

        _post_json(
            send_oob_url,
            {
                'requestType': 'VERIFY_EMAIL',
                'idToken': id_token,
            },
        )
    except urllib.error.HTTPError as exc:
        details = exc.read().decode('utf-8', errors='ignore')
        raise RuntimeError(f'Failed to send verification email via Firebase REST API: {details}') from exc


def _persist_local_user(firebase_user):
    from django.contrib.auth.models import User
    from users.models import UserProfile

    user, _ = User.objects.get_or_create(
        username=firebase_user.uid,
        defaults={'email': firebase_user.email or ''},
    )

    # Keep email in sync if it was empty or changed.
    if firebase_user.email and user.email != firebase_user.email:
        user.email = firebase_user.email
        user.save(update_fields=['email'])

    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'firebase_uid': firebase_user.uid,
            'phone_number': getattr(firebase_user, 'phone_number', None),
            'email_verified': bool(getattr(firebase_user, 'email_verified', False)),
        },
    )

    latest_verified = bool(getattr(firebase_user, 'email_verified', False))
    if profile.email_verified != latest_verified:
        profile.email_verified = latest_verified
        profile.save(update_fields=['email_verified'])

    return user, profile


def main():
    try:
        _bootstrap_django()
        _ensure_firebase_initialized()

        email = input('Email: ').strip()
        password = getpass.getpass('Password: ').strip()

        _validate_inputs(email, password)

        firebase_user = _create_firebase_user(email, password)
        _send_verification_email_with_firebase(email, password)
        user, profile = _persist_local_user(firebase_user)

        print('User created successfully.')
        print('Verification email sent successfully.')
        print(f'Firebase UID: {firebase_user.uid}')
        print(f'Local username: {user.username}')
        print(f'Local email: {user.email}')
        print(f'Local role: {profile.role}')
        print(f'Local email_verified: {profile.email_verified}')
    except KeyboardInterrupt:
        print('\nCanceled by user.')
        sys.exit(1)
    except Exception as exc:
        print(f'Error: {exc}')
        sys.exit(1)


if __name__ == '__main__':
    main()
