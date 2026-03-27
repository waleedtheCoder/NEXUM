# Django + Firebase Auth Backend

This backend now handles email/password auth flow on the server side, including OTP verification by email, Firebase user creation/sign-in, and local profile/session management.

## 1) Prerequisites

- Python 3.10+
- Firebase project with Authentication enabled
- Firebase Admin service account JSON
- SMTP email account for OTP delivery (for example Gmail SMTP)

## 2) Install dependencies

```bash
pip install django djangorestframework firebase-admin
```

## 3) Configure Firebase Admin credentials

Set one of the following:

- Place the credentials JSON at `backend/firebase-adminsdk.json`
- Or set env var `FIREBASE_CREDENTIALS_PATH` to the credentials JSON path

PowerShell example:

```powershell
$env:FIREBASE_CREDENTIALS_PATH = "C:\path\to\firebase-adminsdk.json"
```

## 4) Configure environment (.env)

At minimum, configure these values in `backend/.env`:

```env
# Firebase REST API key (used by backend to generate Firebase auth tokens)
FIREBASE_WEB_API_KEY=your_firebase_web_api_key

# SMTP for OTP emails
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=your_email@gmail.com
```

Notes:

- If using Gmail, use an App Password (not your normal Gmail password).
- In development (`DJANGO_DEBUG=True`), OTP responses may include `otp_debug` for testing.

## 5) Run migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

## 6) Start server

```bash
python manage.py runserver
```

## Create user from terminal (legacy helper)

Run the interactive script:

```bash
python scripts/create_firebase_user.py
```

It will prompt for email and password, then:

- creates the user in Firebase Authentication
- sends Firebase verification email (requires `FIREBASE_WEB_API_KEY` in `.env`)
- creates/updates the matching local Django `User`
- creates the matching local `UserProfile`

## Test backend-managed OTP auth flow

Run the interactive test script:

```bash
python scripts/test_backend_auth_otp_flow.py
```

It will:

- collect name/email/password/role input
- check local DB state before auth flow
- call backend signup to trigger OTP email
- verify OTP (manual by default)
- validate Firebase token issuance and session creation
- verify local user/profile state after flow

If the email already exists, script falls back to login test.

## Auth APIs

### Public auth endpoints (no Authorization header)

#### POST `/api/users/auth/signup/`

Starts registration flow by validating input, generating OTP, and sending OTP to email.

Request body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPass123!",
  "role": "1"
}
```

Role accepted:

- `1` or `shopkeeper`
- `2` or `supplier`

#### POST `/api/users/auth/verify-otp/`

Verifies OTP.

- For `flow=signup`: creates Firebase user, signs in server-side, returns `id_token`, `refresh_token`, `session_id`, and `user`.
- For `flow=reset`: validates OTP for password reset.

Request body:

```json
{
  "email": "john@example.com",
  "flow": "signup",
  "otp": "1234"
}
```

#### POST `/api/users/auth/login/`

Authenticates against Firebase on backend using email/password and returns tokens + local user payload.

Request body:

```json
{
  "email": "john@example.com",
  "password": "StrongPass123!",
  "role": "1"
}
```

#### POST `/api/users/auth/forgot-password/`

Sends OTP for reset flow.

#### POST `/api/users/auth/reset-password/`

Resets Firebase password after OTP verification.

Request body:

```json
{
  "email": "john@example.com",
  "otp": "1234",
  "new_password": "NewStrongPass123!"
}
```

### Protected endpoints (require Firebase ID token)

All endpoints below require:

- Header: `Authorization: Bearer <firebase_id_token>`

#### GET `/api/users/auth/session/`

Verifies token, ensures local profile exists, and returns the authenticated user payload.

#### GET `/api/users/profile/`

Returns current profile.

#### PATCH `/api/users/profile/`

Updates current profile.

Request body (any one or both):

```json
{
  "name": "John Doe",
  "role": "SHOPKEEPER"
}
```

Accepted role values:

- `SHOPKEEPER`
- `SUPPLIER`
- `CUSTOMER`

`POST /api/users/profile/` is supported as an alias of `PATCH` for compatibility.

## Notes

- Backend handles signup/login/OTP/reset orchestration.
- Firebase is still the identity provider and token issuer.
- Backend verifies Firebase tokens for protected profile/session APIs.
