from rest_framework import serializers

from .models import UserProfile


class ProfileResponseSerializer(serializers.Serializer):
    uid               = serializers.CharField()
    email             = serializers.EmailField(allow_blank=True)
    name              = serializers.CharField(allow_blank=True)
    role              = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES)
    phone_number      = serializers.CharField(allow_null=True, allow_blank=True)
    email_verified    = serializers.BooleanField()
    profile_image_url = serializers.CharField(allow_blank=True, default='')


class ProfileUpdateSerializer(serializers.Serializer):
    name              = serializers.CharField(max_length=150, required=False, allow_blank=False)
    role              = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, required=False)
    phone_number      = serializers.CharField(max_length=20, required=False, allow_blank=True)
    profile_image_url = serializers.URLField(required=False, allow_blank=True)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError('Provide at least one field.')
        return attrs
