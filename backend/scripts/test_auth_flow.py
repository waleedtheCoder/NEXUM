import getpass
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

import django
from django.contrib.sessions.backends.db import SessionStore


FIREBASE_BASE_URL = 'https://identitytoolkit.googleapis.com/v1'


def _bootstrap_django():
    # Ensure project root (backend/) is importable even if script is run from backend/scripts.
    project_root = Path(__file__).resolve().parent.parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    django.setup()


def _post_json(url, payload, headers=None):
    request_headers = {'Content-Type': 'application/json'}
    if headers:
        request_headers.update(headers)

    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers=request_headers,
        method='POST',
    )

    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode('utf-8'))


def _get_json(url, headers=None):
    request = urllib.request.Request(url, headers=headers or {}, method='GET')
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode('utf-8'))


def _extract_http_error(exc):
    try:
        body = exc.read().decode('utf-8', errors='ignore')
        parsed = json.loads(body)
        message = parsed.get('error', {}).get('message')
        if message:
            return message
        return body
    except Exception:
        return str(exc)


def _signup_with_firebase(api_key, email, password):
    url = f'{FIREBASE_BASE_URL}/accounts:signUp?key={api_key}'
    payload = {
        'email': email,
        'password': password,
        'returnSecureToken': True,
    }
    return _post_json(url, payload)


def _login_with_firebase(api_key, email, password):
    url = f'{FIREBASE_BASE_URL}/accounts:signInWithPassword?key={api_key}'
    payload = {
        'email': email,
        'password': password,
        'returnSecureToken': True,
    }
    return _post_json(url, payload)


def _is_email_registered(api_key, email):
    url = f'{FIREBASE_BASE_URL}/accounts:createAuthUri?key={api_key}'
    payload = {
        'identifier': email,
        'continueUri': 'http://localhost',
    }
    data = _post_json(url, payload)
    return bool(data.get('registered', False))


def _verify_backend_session(base_url, id_token):
    endpoint = base_url.rstrip('/') + '/api/users/auth/session/'
    headers = {'Authorization': f'Bearer {id_token}'}
    return _get_json(endpoint, headers=headers)


def _create_django_session(flow, firebase_response, backend_profile):
    session = SessionStore()
    session['flow'] = flow
    session['firebase_uid'] = firebase_response.get('localId')
    session['firebase_email'] = firebase_response.get('email', '')
    session['backend_uid'] = backend_profile.get('uid', '')
    session['backend_role'] = backend_profile.get('role', '')
    session.save()
    return session.session_key


def _validate_inputs(email, password, base_url):
    if not email or '@' not in email:
        raise ValueError('Please provide a valid email address.')

    if not password or len(password) < 6:
        raise ValueError('Password must be at least 6 characters long (Firebase minimum).')

    if not base_url.startswith('http://') and not base_url.startswith('https://'):
        raise ValueError('BASE_URL must start with http:// or https://')


def _print_result(label, success, details=''):
    status = 'PASS' if success else 'FAIL'
    suffix = f' ({details})' if details else ''
    print(f'[{status}] {label}{suffix}')


def _choose_flow_mode():
    print('Choose auth flow to test:')
    print('1) Signup')
    print('2) Login')
    print('3) Both')

    raw_choice = input('Enter choice [3]: ').strip() or '3'
    choices = {
        '1': 'signup',
        '2': 'login',
        '3': 'both',
        'signup': 'signup',
        'login': 'login',
        'both': 'both',
    }
    mode = choices.get(raw_choice.lower())
    if not mode:
        raise ValueError('Invalid choice. Use 1, 2, 3, signup, login, or both.')
    return mode


def main():
    try:
        _bootstrap_django()

        api_key = os.getenv('FIREBASE_WEB_API_KEY', '').strip()
        if not api_key:
            raise RuntimeError('FIREBASE_WEB_API_KEY is missing in backend/.env.')

        flow_mode = _choose_flow_mode()
        base_url = 'http://127.0.0.1:8000'
        email = input('Test email: ').strip()
        password = getpass.getpass('Test password: ').strip()

        _validate_inputs(email, password, base_url)

        print('\nRunning register/login flow tests...\n')

        register_response = None
        register_profile = None

        if flow_mode in ('signup', 'both'):
            existed_before_signup = None
            try:
                existed_before_signup = _is_email_registered(api_key, email)
                _print_result('Precheck email already exists', True, str(existed_before_signup))

                register_response = _signup_with_firebase(api_key, email, password)
                _print_result('Register via Firebase', True)

                register_profile = _verify_backend_session(base_url, register_response['idToken'])
                _print_result('Register token accepted by backend', True)

                register_session_id = _create_django_session('register', register_response, register_profile)
                _print_result('Register Django session created', bool(register_session_id), register_session_id)
            except urllib.error.HTTPError as exc:
                message = _extract_http_error(exc)
                if message == 'EMAIL_EXISTS':
                    _print_result('Register via Firebase', False, 'EMAIL_EXISTS')

                    # If this succeeds, the account is usable and likely already existed or was created concurrently.
                    try:
                        login_after_exists = _login_with_firebase(api_key, email, password)
                        register_response = login_after_exists
                        register_profile = _verify_backend_session(base_url, login_after_exists['idToken'])
                        register_session_id = _create_django_session('register-existing', login_after_exists, register_profile)
                        _print_result('Login after EMAIL_EXISTS', True)
                        _print_result('Register-existing token accepted by backend', True)
                        _print_result(
                            'Register-existing Django session created',
                            bool(register_session_id),
                            register_session_id,
                        )

                        if flow_mode == 'both':
                            _print_result('Register flow continuation', True, 'Continuing to login test')
                        else:
                            _print_result('Register flow result', True, 'Account already existed and is usable')
                    except Exception as login_exc:
                        _print_result('Login after EMAIL_EXISTS', False, str(login_exc))
                        if existed_before_signup is False:
                            _print_result(
                                'Possible project/config mismatch',
                                False,
                                'Email was not registered in precheck but signup returned EMAIL_EXISTS',
                            )
                        if flow_mode == 'both':
                            _print_result('Register flow continuation', False, 'Continuing to login test anyway')
                        else:
                            sys.exit(1)
                else:
                    _print_result('Register via Firebase', False, message)
                    sys.exit(1)
            except Exception as exc:
                _print_result('Register flow', False, str(exc))
                sys.exit(1)

        login_response = None
        login_profile = None

        if flow_mode in ('login', 'both'):
            try:
                login_response = _login_with_firebase(api_key, email, password)
                login_profile = _verify_backend_session(base_url, login_response['idToken'])
                login_session_id = _create_django_session('login', login_response, login_profile)
                _print_result('Login via Firebase', True)
                _print_result('Login token accepted by backend', True)
                _print_result('Login Django session created', bool(login_session_id), login_session_id)
            except urllib.error.HTTPError as exc:
                _print_result('Login flow', False, _extract_http_error(exc))
                sys.exit(1)
            except Exception as exc:
                _print_result('Login flow', False, str(exc))
                sys.exit(1)

        final_response = login_response or register_response
        final_profile = login_profile or register_profile

        if final_response and final_profile:
            print('\nSummary')
            print(f"- Firebase UID: {final_response.get('localId', '')}")
            print(f"- Firebase email: {final_response.get('email', '')}")
            print(f"- Backend role: {final_profile.get('role', '')}")
            print(f"- Backend email_verified: {final_profile.get('email_verified', False)}")

        print('\nDone.')

    except KeyboardInterrupt:
        print('\nCanceled by user.')
        sys.exit(1)
    except Exception as exc:
        print(f'Error: {exc}')
        sys.exit(1)


if __name__ == '__main__':
    main()
