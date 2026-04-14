from rest_framework.views import APIView
from rest_framework.response import Response

from users.models import UserProfile


class RegisterFCMTokenView(APIView):
    """
    POST /api/users/fcm-token/
    Protected. Called by the app on login to register the device's FCM token
    so the backend can send push notifications to this device.

    Body:   { "fcm_token": "<expo-or-native-fcm-device-token>" }
    Response (200): { "detail": "FCM token registered." }

    The frontend should call this immediately after a successful login,
    using expo-notifications to retrieve the token:

        import * as Notifications from 'expo-notifications';
        const { data: token } = await Notifications.getExpoPushTokenAsync();
        await fetch('/api/users/fcm-token/', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fcm_token: token }),
        });
    """
    def post(self, request):
        token = request.data.get('fcm_token', '').strip()
        if token:
            UserProfile.objects.filter(user=request.user).update(fcm_token=token)
        return Response({'detail': 'FCM token registered.'})
