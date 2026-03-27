from unittest.mock import patch

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import UserProfile


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
