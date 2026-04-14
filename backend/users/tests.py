from unittest.mock import patch

from django.contrib.auth.models import User
from django.contrib.sessions.models import Session
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import UserProfile
from .views import _create_session_id, _create_anonymous_session_id


class UserAuthFlowTests(APITestCase):
	@staticmethod
	def _auth_header(token='valid-token'):
		return {'HTTP_AUTHORIZATION': f'Bearer {token}'}

	@patch('users.authentication.firebase_admin.get_app')
	@patch('users.authentication.auth.verify_id_token')
	def test_signup_email_password_creates_user_with_default_profile(self, mock_verify_id_token, mock_get_app):
		"""
		Simulates first login right after Firebase Email/Password signup.
		Backend should create local User + UserProfile with default role.
		"""
		mock_verify_id_token.return_value = {
			'uid': 'signup-user-1',
			'email': 'signup1@example.com',
			'phone_number': '',
			'email_verified': False,
		}

		response = self.client.get('/api/users/auth/session/', **self._auth_header())

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['uid'], 'signup-user-1')
		self.assertEqual(response.data['email'], 'signup1@example.com')
		self.assertEqual(response.data['name'], '')
		self.assertEqual(response.data['role'], 'CUSTOMER')
		self.assertEqual(response.data['phone_number'], '')
		self.assertFalse(response.data['email_verified'])

		user = User.objects.get(username='signup-user-1')
		profile = UserProfile.objects.get(user=user)
		self.assertEqual(user.email, 'signup1@example.com')
		self.assertEqual(profile.firebase_uid, 'signup-user-1')
		self.assertEqual(profile.role, 'CUSTOMER')
		self.assertFalse(profile.email_verified)

	@patch('users.authentication.firebase_admin.get_app')
	@patch('users.authentication.auth.verify_id_token')
	def test_signup_is_idempotent_does_not_create_duplicate_user_profile(self, mock_verify_id_token, mock_get_app):
		mock_verify_id_token.return_value = {
			'uid': 'signup-user-2',
			'email': 'signup2@example.com',
			'email_verified': False,
		}

		first = self.client.get('/api/users/auth/session/', **self._auth_header())
		second = self.client.get('/api/users/auth/session/', **self._auth_header())

		self.assertEqual(first.status_code, status.HTTP_200_OK)
		self.assertEqual(second.status_code, status.HTTP_200_OK)
		self.assertEqual(User.objects.filter(username='signup-user-2').count(), 1)

		user = User.objects.get(username='signup-user-2')
		self.assertEqual(UserProfile.objects.filter(user=user).count(), 1)

	@patch('users.authentication.firebase_admin.get_app')
	@patch('users.authentication.auth.verify_id_token')
	def test_auth_session_creates_local_user_and_profile(self, mock_verify_id_token, mock_get_app):
		mock_verify_id_token.return_value = {
			'uid': 'firebase-user-1',
			'email': 'user1@example.com',
			'phone_number': '+923001234567',
			'email_verified': False,
		}

		response = self.client.get('/api/users/auth/session/', **self._auth_header())

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['uid'], 'firebase-user-1')
		self.assertEqual(response.data['email'], 'user1@example.com')
		self.assertEqual(response.data['role'], 'CUSTOMER')
		self.assertFalse(response.data['email_verified'])

		user = User.objects.get(username='firebase-user-1')
		profile = UserProfile.objects.get(user=user)
		self.assertEqual(profile.firebase_uid, 'firebase-user-1')
		self.assertEqual(profile.phone_number, '+923001234567')
		self.assertFalse(profile.email_verified)

	@patch('users.authentication.firebase_admin.get_app')
	@patch('users.authentication.auth.verify_id_token')
	def test_auth_session_syncs_email_verified_when_claim_changes(self, mock_verify_id_token, mock_get_app):
		mock_verify_id_token.return_value = {
			'uid': 'firebase-user-verified-sync',
			'email': 'verified@example.com',
			'email_verified': False,
		}

		self.client.get('/api/users/auth/session/', **self._auth_header())

		mock_verify_id_token.return_value = {
			'uid': 'firebase-user-verified-sync',
			'email': 'verified@example.com',
			'email_verified': True,
		}

		response = self.client.get('/api/users/auth/session/', **self._auth_header())

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(response.data['email_verified'])

		user = User.objects.get(username='firebase-user-verified-sync')
		profile = UserProfile.objects.get(user=user)
		self.assertTrue(profile.email_verified)

	@patch('users.authentication.firebase_admin.get_app')
	@patch('users.authentication.auth.verify_id_token')
	def test_profile_patch_updates_name_and_role(self, mock_verify_id_token, mock_get_app):
		mock_verify_id_token.return_value = {
			'uid': 'firebase-user-2',
			'email': 'user2@example.com',
			'email_verified': False,
		}

		# First call creates local user/profile via auth middleware.
		self.client.get('/api/users/auth/session/', **self._auth_header())

		patch_response = self.client.patch(
			'/api/users/profile/',
			{'name': 'Ali Khan', 'role': 'SHOPKEEPER'},
			format='json',
			**self._auth_header(),
		)

		self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
		self.assertEqual(patch_response.data['name'], 'Ali Khan')
		self.assertEqual(patch_response.data['role'], 'SHOPKEEPER')

		user = User.objects.get(username='firebase-user-2')
		profile = UserProfile.objects.get(user=user)
		self.assertEqual(user.first_name, 'Ali Khan')
		self.assertEqual(profile.role, 'SHOPKEEPER')

	@patch('users.authentication.firebase_admin.get_app')
	@patch('users.authentication.auth.verify_id_token')
	def test_profile_post_alias_updates_profile(self, mock_verify_id_token, mock_get_app):
		mock_verify_id_token.return_value = {
			'uid': 'signup-user-3',
			'email': 'signup3@example.com',
			'email_verified': False,
		}

		self.client.get('/api/users/auth/session/', **self._auth_header())

		post_response = self.client.post(
			'/api/users/profile/',
			{'name': 'Waleed', 'role': 'SUPPLIER'},
			format='json',
			**self._auth_header(),
		)

		self.assertEqual(post_response.status_code, status.HTTP_200_OK)
		self.assertEqual(post_response.data['name'], 'Waleed')
		self.assertEqual(post_response.data['role'], 'SUPPLIER')

	@patch('users.authentication.firebase_admin.get_app')
	@patch('users.authentication.auth.verify_id_token')
	def test_profile_patch_rejects_invalid_role(self, mock_verify_id_token, mock_get_app):
		mock_verify_id_token.return_value = {
			'uid': 'signup-user-4',
			'email': 'signup4@example.com',
			'email_verified': False,
		}

		self.client.get('/api/users/auth/session/', **self._auth_header())

		response = self.client.patch(
			'/api/users/profile/',
			{'role': 'INVALID_ROLE'},
			format='json',
			**self._auth_header(),
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('role', response.data)

	@patch('users.authentication.firebase_admin.get_app')
	@patch('users.authentication.auth.verify_id_token')
	def test_profile_patch_requires_at_least_one_field(self, mock_verify_id_token, mock_get_app):
		mock_verify_id_token.return_value = {
			'uid': 'signup-user-5',
			'email': 'signup5@example.com',
			'email_verified': False,
		}

		self.client.get('/api/users/auth/session/', **self._auth_header())

		response = self.client.patch(
			'/api/users/profile/',
			{},
			format='json',
			**self._auth_header(),
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	@patch('users.authentication.firebase_admin.get_app')
	def test_invalid_auth_header_format_returns_403(self, mock_get_app):
		response = self.client.get(
			'/api/users/auth/session/',
			HTTP_AUTHORIZATION='Token abc123',
		)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	@patch('users.authentication.firebase_admin.get_app')
	@patch('users.authentication.auth.verify_id_token')
	def test_invalid_token_returns_403(self, mock_verify_id_token, mock_get_app):
		mock_verify_id_token.side_effect = Exception('Token expired')

		response = self.client.get('/api/users/auth/session/', **self._auth_header('bad-token'))

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_missing_auth_header_returns_403(self):
		response = self.client.get('/api/users/auth/session/')

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ── Helper ────────────────────────────────────────────────────────────────────

def _make_user(username, email, role):
	"""Create a Django User + UserProfile directly (no Firebase needed)."""
	user = User.objects.create_user(username=username, email=email, password='testpass')
	UserProfile.objects.create(
		user=user,
		firebase_uid=f'uid-{username}',
		role=role,
		email_verified=True,
	)
	return user


# ── Session ID tests ──────────────────────────────────────────────────────────

class SessionIDPrefixTests(APITestCase):
	"""Verify that session keys carry the correct role prefix."""

	def test_shopkeeper_session_has_sk_prefix(self):
		user = _make_user('sk_user', 'sk@test.com', 'SHOPKEEPER')
		sid = _create_session_id(user, 'SHOPKEEPER')
		self.assertTrue(sid.startswith('sk_'), f"Expected 'sk_' prefix, got: {sid}")

	def test_supplier_session_has_su_prefix(self):
		user = _make_user('su_user', 'su@test.com', 'SUPPLIER')
		sid = _create_session_id(user, 'SUPPLIER')
		self.assertTrue(sid.startswith('su_'), f"Expected 'su_' prefix, got: {sid}")

	def test_admin_session_has_ad_prefix(self):
		user = _make_user('ad_user', 'ad@test.com', 'ADMIN')
		sid = _create_session_id(user, 'ADMIN')
		self.assertTrue(sid.startswith('ad_'), f"Expected 'ad_' prefix, got: {sid}")

	def test_anonymous_session_has_anon_prefix(self):
		sid = _create_anonymous_session_id()
		self.assertTrue(sid.startswith('anon_'), f"Expected 'anon_' prefix, got: {sid}")

	def test_session_key_stored_in_db_with_prefix(self):
		user = _make_user('db_user', 'db@test.com', 'SHOPKEEPER')
		sid = _create_session_id(user, 'SHOPKEEPER')
		exists = Session.objects.filter(session_key=sid).exists()
		self.assertTrue(exists, f"Session '{sid}' not found in DB after creation")

	def test_unprefixed_key_not_left_in_db(self):
		"""The raw session key (before rename) must not remain in the DB."""
		user = _make_user('raw_user', 'raw@test.com', 'SUPPLIER')
		sid = _create_session_id(user, 'SUPPLIER')
		raw_key = sid[len('su_'):]  # strip the prefix to get original key
		orphan = Session.objects.filter(session_key=raw_key).exists()
		self.assertFalse(orphan, f"Unprefixed key '{raw_key}' should have been renamed but still exists in DB")


class SessionIDAuthRouteTests(APITestCase):
	"""Authenticated routes should accept X-Session-ID and reject invalid ones."""

	def setUp(self):
		self.user = _make_user('route_user', 'route@test.com', 'SHOPKEEPER')
		self.session_id = _create_session_id(self.user, 'SHOPKEEPER')

	def _session_header(self, sid=None):
		return {'HTTP_X_SESSION_ID': sid or self.session_id}

	def test_auth_session_get_returns_200_with_valid_session(self):
		response = self.client.get('/api/users/auth/session/', **self._session_header())
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['email'], 'route@test.com')

	def test_auth_session_rejects_invalid_session_id(self):
		response = self.client.get('/api/users/auth/session/', **self._session_header('sk_doesnotexist'))
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_auth_session_rejects_blank_session_id(self):
		response = self.client.get('/api/users/auth/session/', HTTP_X_SESSION_ID='')
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_profile_get_returns_200_with_valid_session(self):
		response = self.client.get('/api/users/profile/', **self._session_header())
		self.assertEqual(response.status_code, status.HTTP_200_OK)

	def test_session_header_via_authorization_session_scheme(self):
		"""X-Session-ID can also be passed as 'Session <id>' in Authorization header."""
		response = self.client.get(
			'/api/users/auth/session/',
			HTTP_AUTHORIZATION=f'Session {self.session_id}',
		)
		self.assertEqual(response.status_code, status.HTTP_200_OK)


class SessionIDRotationTests(APITestCase):
	"""Rotation should issue a fresh prefixed session and invalidate the old one."""

	def setUp(self):
		self.user = _make_user('rotate_user', 'rotate@test.com', 'SUPPLIER')
		self.old_sid = _create_session_id(self.user, 'SUPPLIER')

	def test_rotate_returns_200_and_new_session_id(self):
		response = self.client.post(
			'/api/users/auth/rotate-session/',
			{},
			format='json',
			HTTP_X_SESSION_ID=self.old_sid,
		)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('session_id', response.data)

	def test_rotated_session_has_correct_role_prefix(self):
		response = self.client.post(
			'/api/users/auth/rotate-session/',
			{},
			format='json',
			HTTP_X_SESSION_ID=self.old_sid,
		)
		new_sid = response.data['session_id']
		self.assertTrue(new_sid.startswith('su_'), f"Expected 'su_' prefix after rotation, got: {new_sid}")

	def test_old_session_deleted_after_rotation(self):
		response = self.client.post(
			'/api/users/auth/rotate-session/',
			{},
			format='json',
			HTTP_X_SESSION_ID=self.old_sid,
		)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		old_still_exists = Session.objects.filter(session_key=self.old_sid).exists()
		self.assertFalse(old_still_exists, "Old session should be deleted after rotation")

	def test_new_session_present_in_db_after_rotation(self):
		response = self.client.post(
			'/api/users/auth/rotate-session/',
			{},
			format='json',
			HTTP_X_SESSION_ID=self.old_sid,
		)
		new_sid = response.data['session_id']
		new_exists = Session.objects.filter(session_key=new_sid).exists()
		self.assertTrue(new_exists, f"New session '{new_sid}' not found in DB after rotation")

	def test_rotate_without_session_returns_403(self):
		response = self.client.post('/api/users/auth/rotate-session/', {}, format='json')
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class SessionIDGuestSessionTests(APITestCase):
	"""Guest sessions must be created without authentication."""

	def test_guest_session_returns_200(self):
		response = self.client.post('/api/users/auth/guest-session/', {}, format='json')
		self.assertEqual(response.status_code, status.HTTP_200_OK)

	def test_guest_session_response_contains_session_id(self):
		response = self.client.post('/api/users/auth/guest-session/', {}, format='json')
		self.assertIn('session_id', response.data)

	def test_guest_session_id_has_anon_prefix(self):
		response = self.client.post('/api/users/auth/guest-session/', {}, format='json')
		sid = response.data['session_id']
		self.assertTrue(sid.startswith('anon_'), f"Expected 'anon_' prefix, got: {sid}")

	def test_guest_session_stored_in_db(self):
		response = self.client.post('/api/users/auth/guest-session/', {}, format='json')
		sid = response.data['session_id']
		self.assertTrue(Session.objects.filter(session_key=sid).exists())

	def test_guest_session_cannot_access_protected_route(self):
		"""A guest (anon_) session must not authenticate against protected endpoints."""
		response = self.client.post('/api/users/auth/guest-session/', {}, format='json')
		guest_sid = response.data['session_id']
		profile_response = self.client.get(
			'/api/users/auth/session/',
			HTTP_X_SESSION_ID=guest_sid,
		)
		self.assertEqual(profile_response.status_code, status.HTTP_403_FORBIDDEN)


class SessionIDLogoutTests(APITestCase):
	"""Logout must delete the session from the DB."""

	def setUp(self):
		self.user = _make_user('logout_user', 'logout@test.com', 'SHOPKEEPER')
		self.session_id = _create_session_id(self.user, 'SHOPKEEPER')

	def test_logout_returns_200(self):
		response = self.client.post(
			'/api/users/auth/logout/',
			{},
			format='json',
			HTTP_X_SESSION_ID=self.session_id,
		)
		self.assertEqual(response.status_code, status.HTTP_200_OK)

	def test_logout_deletes_session_from_db(self):
		self.client.post(
			'/api/users/auth/logout/',
			{},
			format='json',
			HTTP_X_SESSION_ID=self.session_id,
		)
		still_exists = Session.objects.filter(session_key=self.session_id).exists()
		self.assertFalse(still_exists, "Session should be removed from DB after logout")

	def test_session_rejected_after_logout(self):
		self.client.post(
			'/api/users/auth/logout/',
			{},
			format='json',
			HTTP_X_SESSION_ID=self.session_id,
		)
		response = self.client.get(
			'/api/users/auth/session/',
			HTTP_X_SESSION_ID=self.session_id,
		)
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_logout_with_no_session_id_still_returns_200(self):
		"""Logout is best-effort — no session ID should not blow up."""
		response = self.client.post('/api/users/auth/logout/', {}, format='json')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
