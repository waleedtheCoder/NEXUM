# ─────────────────────────────────────────────
# promotions/serializers.py
# ─────────────────────────────────────────────
from rest_framework import serializers
from .models import Promotion


class PromotionSerializer(serializers.ModelSerializer):
    """
    camelCase field names match HomeScreen PROMOS array shape:
    { id, title, subtitle, imageUrl, actionUrl, badge }
    """
    imageUrl  = serializers.URLField(source='image_url')
    actionUrl = serializers.CharField(source='action_url')

    class Meta:
        model  = Promotion
        fields = ['id', 'title', 'subtitle', 'imageUrl', 'actionUrl', 'badge']
