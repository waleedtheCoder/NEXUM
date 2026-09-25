import uuid

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.storage import upload_image, StorageNotConfigured, StorageUploadFailed


class ProfileImageUploadView(APIView):
    """
    POST /api/users/profile/image/
    Accepts a multipart image file, uploads it to Supabase Storage
    (listings bucket, profile_images/ folder), and returns the public URL. The frontend should then PATCH /api/users/profile/
    with { profile_image_url: <returned url> } to persist it.

    Request:  multipart/form-data  { image: <file> }
    Response: { imageUrl: "https://<project>.supabase.co/storage/v1/object/public/listings/profile_images/<uuid>.<ext>" }
    """
    ALLOWED_TYPES  = {'image/jpeg', 'image/png', 'image/webp'}
    MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

    def post(self, request):
        image = request.FILES.get('image')
        if not image:
            return Response({'detail': 'No image file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        if image.content_type not in self.ALLOWED_TYPES:
            return Response(
                {'detail': 'Unsupported file type. Use JPEG, PNG, or WebP.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if image.size > self.MAX_SIZE_BYTES:
            return Response(
                {'detail': 'File too large. Maximum size is 5 MB.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ext      = image.name.rsplit('.', 1)[-1].lower() if '.' in image.name else 'jpg'
        filename = f"profile_images/{uuid.uuid4().hex}.{ext}"

        try:
            url = upload_image(image.read(), image.content_type, filename)
        except StorageNotConfigured as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except StorageUploadFailed as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({'imageUrl': url}, status=status.HTTP_201_CREATED)
