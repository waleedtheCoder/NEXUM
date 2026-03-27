import getpass
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

import django


def _bootstrap_django():
    project_root = Path(__file__).resolve().parent.parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    django.setup()


def _post_json(url, payload, headers=None):
    req_headers = {'Content-Type': 'application/json'}
    if headers:
        req_headers.update(headers)

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers=req_headers,
        method='POST',
    )

    with urllib.request.urlopen(req, timeout=45) as response:
        return response.getcode(), json.loads(response.read().decode('utf-8'))


def _get_json(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {}, method='GET')
    with urllib.request.urlopen(req, timeout=45) as response:
        return response.getcode(), json.loads(response.read().decode('utf-8'))


def _http_error_payload(exc):
    status_code = getattr(exc, 'code', 500)
    try:
        payload = json.loads(exc.read().decode('utf-8', errors='ignore'))
    except Exception:
        payload = {'detail': str(exc)}
    return status_code, payload


def _local_user_state(email):
    from django.contrib.auth.models import User

    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return None, None

    profile = getattr(user, 'profile', None)
    return user, profile


def _print_block(title):
    print('\n' + '=' * 64)
    print(title)
    print('=' * 64)


def _input_nonempty(label, default=None, secret=False):
    while True:
        if secret:
            value = getpass.getpass(label).strip()
        else:
            raw = input(label).strip()
            value = raw or (default if default is not None else '')
        if value:
            return value
        print('Value cannot be empty.')


def _print_user_state(prefix, user, profile):
    if not user:
        print(f'{prefix}: user does not exist in local DB')
        return

    print(f'{prefix}: user exists in local DB')
    print(f'- username: {user.username}')
    print(f'- email: {user.email}')
    if profile:
        print(f'- profile.firebase_uid: {profile.firebase_uid}')
        print(f'- profile.role: {profile.role}')
        print(f'- profile.email_verified: {profile.email_verified}')
    else:
        print('- profile: missing')


def _normalize_role_input(raw_role):
    value = (raw_role or '').strip().lower()
    role_map = {
        '1': 'shopkeeper',
        '2': 'supplier',
        'shopkeeper': 'shopkeeper',
        'supplier': 'supplier',
    }
    return role_map.get(value, 'shopkeeper')


def _want_debug_otp_autofill():
    choice = input('Use debug OTP auto-fill if backend returns it? [y/N]: ').strip().lower()
    return choice in {'y', 'yes'}


def main():
    try:
        _bootstrap_django()

        base_url = os.getenv('BACKEND_BASE_URL', 'http://127.0.0.1:8000').strip().rstrip('/')
        custom_base = input(f'Backend base URL [{base_url}] (press Enter to keep): ').strip()
        if custom_base:
            base_url = custom_base.rstrip('/')

        name = input('Full name [Test User]: ').strip() or 'Test User'
        role_input = input('Role [1=shopkeeper, 2=supplier] (default 1): ').strip() or '1'
        role = _normalize_role_input(role_input)
        use_debug_otp_autofill = _want_debug_otp_autofill()
        email = _input_nonempty('Email: ')
        password = _input_nonempty('Password: ', secret=True)

        _print_block('1) Check local DB before flow')
        before_user, before_profile = _local_user_state(email)
        _print_user_state('Before', before_user, before_profile)

        _print_block('2) Start signup to trigger OTP email')
        signup_url = f'{base_url}/api/users/auth/signup/'
        signup_payload = {
            'name': name,
            'email': email,
            'password': password,
            'role': role,
        }

        try:
            signup_status, signup_data = _post_json(signup_url, signup_payload)
            print(f'Signup status: {signup_status}')
            print(f"Signup message: {signup_data.get('message', '')}")
        except urllib.error.HTTPError as exc:
            signup_status, signup_data = _http_error_payload(exc)
            print(f'Signup status: {signup_status}')
            print(f'Signup response: {signup_data}')

        id_token = None
        session_id = None

        if signup_status in (200, 201):
            otp = signup_data.get('otp_debug')
            if otp and use_debug_otp_autofill:
                print(f'DEBUG OTP from backend: {otp}')
            else:
                if otp and not use_debug_otp_autofill:
                    print('Debug OTP is available, but auto-fill is disabled for this run.')
                otp = _input_nonempty('Enter OTP received on email: ')

            _print_block('3) Verify OTP and create Firebase user/token')
            verify_url = f'{base_url}/api/users/auth/verify-otp/'
            verify_payload = {
                'email': email,
                'flow': 'signup',
                'otp': otp,
            }

            try:
                verify_status, verify_data = _post_json(verify_url, verify_payload)
                print(f'Verify status: {verify_status}')
                print(f"Verify keys: {', '.join(sorted(verify_data.keys()))}")
                id_token = verify_data.get('id_token')
                session_id = verify_data.get('session_id')
            except urllib.error.HTTPError as exc:
                verify_status, verify_data = _http_error_payload(exc)
                print(f'Verify status: {verify_status}')
                print(f'Verify response: {verify_data}')
        elif signup_status == 409:
            _print_block('3) User already exists, test login token generation')
            login_url = f'{base_url}/api/users/auth/login/'
            login_payload = {
                'email': email,
                'password': password,
                'role': role,
            }
            try:
                login_status, login_data = _post_json(login_url, login_payload)
                print(f'Login status: {login_status}')
                print(f"Login keys: {', '.join(sorted(login_data.keys()))}")
                id_token = login_data.get('id_token')
                session_id = login_data.get('session_id')
            except urllib.error.HTTPError as exc:
                login_status, login_data = _http_error_payload(exc)
                print(f'Login status: {login_status}')
                print(f'Login response: {login_data}')
        else:
            print('Stopping because signup failed unexpectedly.')
            sys.exit(1)

        if not id_token:
            print('No Firebase id_token returned, cannot continue session check.')
            sys.exit(1)

        _print_block('4) Verify backend auth/session endpoint with Firebase token')
        session_url = f'{base_url}/api/users/auth/session/'
        headers = {'Authorization': f'Bearer {id_token}'}
        try:
            session_status, session_data = _get_json(session_url, headers=headers)
            print(f'Session status: {session_status}')
            print(f"Session payload: {session_data}")
        except urllib.error.HTTPError as exc:
            session_status, session_data = _http_error_payload(exc)
            print(f'Session status: {session_status}')
            print(f'Session response: {session_data}')

        _print_block('5) Check local DB after flow')
        after_user, after_profile = _local_user_state(email)
        _print_user_state('After', after_user, after_profile)

        _print_block('Summary')
        print(f'- session_id returned: {bool(session_id)}')
        print(f'- firebase id_token returned: {bool(id_token)}')
        print('- local user exists after flow: ' + str(bool(after_user)))

    except KeyboardInterrupt:
        print('\nCanceled by user.')
        sys.exit(1)
    except Exception as exc:
        print(f'Error: {exc}')
        sys.exit(1)


if __name__ == '__main__':
    main()
