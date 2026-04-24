from django.db import models
from django.contrib.auth.models import User


class MarketSnapshot(models.Model):
    """Pre-computed monthly sales aggregates per city+category, refreshed daily."""
    city = models.CharField(max_length=255, db_index=True)
    category = models.CharField(max_length=100, db_index=True)
    month = models.DateField(db_index=True)  # always the 1st of the month
    units_sold = models.PositiveIntegerField(default=0)
    revenue = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    order_count = models.PositiveIntegerField(default=0)
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('city', 'category', 'month')
        ordering = ['-month', 'city', 'category']

    def __str__(self):
        return f"{self.city} / {self.category} / {self.month}"


class TopProduct(models.Model):
    """Top-10 listings by units sold per city, refreshed monthly."""
    city = models.CharField(max_length=255, db_index=True)
    listing = models.ForeignKey(
        'listings.Listing', on_delete=models.CASCADE, related_name='top_rankings'
    )
    rank = models.PositiveSmallIntegerField()
    units_sold = models.PositiveIntegerField()
    month = models.DateField()
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('city', 'listing', 'month')
        ordering = ['city', 'rank']


class DemandForecast(models.Model):
    """Linear-trend demand prediction for next month per city+category."""
    city = models.CharField(max_length=255, db_index=True)
    category = models.CharField(max_length=100, db_index=True)
    forecast_month = models.DateField()
    predicted_units = models.FloatField()
    confidence = models.FloatField()  # R² clamped to [0, 1]
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('city', 'category', 'forecast_month')
        ordering = ['-forecast_month', '-predicted_units']


class SupplierAnalysis(models.Model):
    """Biweekly per-listing insight for verified (premium) suppliers."""
    listing = models.ForeignKey(
        'listings.Listing', on_delete=models.CASCADE, related_name='analyses'
    )
    period_start = models.DateField()
    recommended_price = models.DecimalField(max_digits=10, decimal_places=2)
    price_impact_summary = models.TextField()
    best_city = models.CharField(max_length=255)
    city_reasoning = models.TextField()
    is_low_performing = models.BooleanField(default=False)
    low_perf_guidance = models.TextField(blank=True)
    portfolio_suggestions = models.JSONField(default=list)
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('listing', 'period_start')
        ordering = ['-period_start']


class ShopkeeperRecommendation(models.Model):
    """Cached daily product recommendations per shopkeeper."""
    shopkeeper = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='analytics_recommendation'
    )
    listing_ids = models.JSONField(default=list)
    reasoning = models.TextField()
    computed_at = models.DateTimeField(auto_now=True)
