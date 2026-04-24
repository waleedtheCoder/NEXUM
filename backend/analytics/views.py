from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class MarketCurrentView(APIView):
    """GET /api/analytics/market/current/?city=Karachi"""

    def get(self, request):
        from analytics.services.market import get_current_month_summary
        city = request.query_params.get('city', '')
        return Response(get_current_month_summary(city))


class MarketHistoryView(APIView):
    """GET /api/analytics/market/history/?city=Karachi&category=Electronics"""

    def get(self, request):
        from analytics.services.market import get_history
        city = request.query_params.get('city', '')
        category = request.query_params.get('category', '')
        return Response(get_history(city=city, category=category))


class MarketForecastView(APIView):
    """GET /api/analytics/market/forecast/?city=Karachi"""

    def get(self, request):
        from analytics.services.forecast import get_forecast
        city = request.query_params.get('city', '')
        return Response(get_forecast(city))


class MarketTopProductsView(APIView):
    """GET /api/analytics/market/top-products/?city=Karachi"""

    def get(self, request):
        from analytics.services.market import get_top_products
        city = request.query_params.get('city', '')
        return Response(get_top_products(city))


class SupplierAnalysisView(APIView):
    """GET /api/analytics/supplier/ — verified suppliers only"""

    def get(self, request):
        profile = request.user.profile
        if profile.role != 'SUPPLIER':
            return Response(
                {'error': 'Only suppliers can access this endpoint.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if profile.verification_status != 'verified':
            return Response(
                {'error': 'Personal analysis is available for verified (premium) suppliers only.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        from analytics.services.supplier import get_supplier_analysis
        return Response(get_supplier_analysis(request.user))


class ShopkeeperRecommendationsView(APIView):
    """GET /api/analytics/shopkeeper/ — shopkeepers only"""

    def get(self, request):
        profile = request.user.profile
        if profile.role != 'SHOPKEEPER':
            return Response(
                {'error': 'Only shopkeepers can access this endpoint.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        from analytics.services.shopkeeper import get_recommendations
        return Response(get_recommendations(request.user))


class AdminRefreshView(APIView):
    """POST /api/analytics/admin/refresh/ — staff only, triggers full rebuild"""

    def post(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)

        from analytics.services.embeddings import build_index
        from analytics.services.market import rebuild_snapshots, rebuild_top_products
        from analytics.services.forecast import rebuild_forecasts

        docs = build_index(force=True)
        snaps = rebuild_snapshots()
        rebuild_top_products()
        forecasts = rebuild_forecasts()

        return Response({
            'embeddingsIndexed': docs,
            'snapshotsUpdated': snaps,
            'forecastsUpdated': forecasts,
        })
