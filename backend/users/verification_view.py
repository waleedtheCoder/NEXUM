from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import UserProfile


class SupplierVerificationView(APIView):
    """
    POST /api/users/verification/request/
    Authenticated supplier submits a verification request.
    Sets verification_status to 'pending' if currently 'none'.
    """
    def post(self, request):
        try:
            profile = request.user.profile
        except UserProfile.DoesNotExist:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        if profile.role != 'SUPPLIER':
            return Response({'detail': 'Only suppliers can request verification.'}, status=status.HTTP_403_FORBIDDEN)

        if profile.verification_status == 'verified':
            return Response({'detail': 'Already verified.'}, status=status.HTTP_400_BAD_REQUEST)

        if profile.verification_status == 'pending':
            return Response({'detail': 'Verification already pending.'}, status=status.HTTP_400_BAD_REQUEST)

        profile.verification_status = 'pending'
        profile.save(update_fields=['verification_status'])

        return Response({'detail': 'Verification request submitted.', 'verification_status': 'pending'})
