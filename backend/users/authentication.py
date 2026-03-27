import firebase_admin
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from firebase_admin import auth
from django.contrib.auth.models import User

from .models import UserProfile

class FirebaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None

        parts = auth_header.split(' ')
        if len(parts) != 2 or parts[0].lower() != 'bearer' or not parts[1]:
            raise AuthenticationFailed('Invalid token header format. Use "Bearer <token>"')
        token = parts[1]

        try:
            firebase_admin.get_app()
        except ValueError as exc:
            raise AuthenticationFailed(
                'Firebase Admin SDK is not initialized. Configure FIREBASE_CREDENTIALS_PATH.'
            ) from exc

        try:
            decoded_token = auth.verify_id_token(token)
            uid = decoded_token.get('uid')
            email = decoded_token.get('email', f"{uid}@firebase.local")
            phone = decoded_token.get('phone_number', '')
            email_verified = bool(decoded_token.get('email_verified', False))
        except Exception as e:
            raise AuthenticationFailed(f'Invalid or expired Firebase ID Token: {str(e)}')

        if not uid:
            raise AuthenticationFailed('Invalid Firebase token payload: uid is missing.')

        # Get or create the user in Django DB
        user, _ = User.objects.get_or_create(username=uid, defaults={'email': email})

        if email and user.email != email:
            user.email = email
            user.save(update_fields=['email'])
        
        # Link the custom profile
        profile, created = UserProfile.objects.get_or_create(
            user=user, 
            defaults={
                'firebase_uid': uid,
                'phone_number': phone,
                'email_verified': email_verified,
            }
        )

        if not created:
            update_fields = []
            if profile.phone_number != phone:
                profile.phone_number = phone
                update_fields.append('phone_number')
            if profile.email_verified != email_verified:
                profile.email_verified = email_verified
                update_fields.append('email_verified')
            if update_fields:
                profile.save(update_fields=update_fields)

        return (user, None)
