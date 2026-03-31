import uuid

from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class ProfileImageUploadView(APIView):
    """
    POST /api/users/profile/image/
    Accepts a multipart image file, saves it to MEDIA_ROOT/profile_images/,
    and returns the public URL. The frontend should then PATCH /api/users/profile/
    with { profile_image_url: <returned url> } to persist it.

    Request:  multipart/form-data  { image: <file> }
    Response: { imageUrl: "http://.../media/profile_images/<uuid>.<ext>" }
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

        ext      = image.name.rsplit('.', 1)[-1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        path     = default_storage.save(f"profile_images/{filename}", ContentFile(image.read()))
        url      = request.build_absolute_uri(default_storage.url(path))

        return Response({'imageUrl': url}, status=status.HTTP_201_CREATED)
