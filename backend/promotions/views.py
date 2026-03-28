from django.utils import timezone
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import Promotion
from .serializers import PromotionSerializer


class PromotionListView(APIView):
    """
    GET /api/promotions/
    Public. Returns active promotions that are within their date window.
    Replaces the hardcoded PROMOS array in HomeScreen.js.
    """
    authentication_classes = []
    permission_classes     = [AllowAny]

    def get(self, request):
        now = timezone.now()
        promos = Promotion.objects.filter(is_active=True).filter(
            Q(starts_at__isnull=True) | Q(starts_at__lte=now)
        ).filter(
            Q(ends_at__isnull=True) | Q(ends_at__gte=now)
        )
        return Response(PromotionSerializer(promos, many=True).data)
