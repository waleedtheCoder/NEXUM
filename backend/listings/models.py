from django.db import models
from django.contrib.auth.models import User


class Listing(models.Model):
    UNIT_CHOICES = [
        ('kg', 'kg'),
        ('liters', 'liters'),
        ('pieces', 'pieces'),
        ('boxes', 'boxes'),
        ('cartons', 'cartons'),
        ('bags', 'bags'),
        ('bottles', 'bottles'),
    ]
    CONDITION_CHOICES = [
        ('New', 'New'),
        ('Bulk Wholesale', 'Bulk Wholesale'),
        ('Clearance Stock', 'Clearance Stock'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('pending', 'Pending'),
        ('removed', 'Removed'),
    ]

    supplier = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='listings'
    )
    product_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    # price is per-unit (pricePerUnit in frontend)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField()
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default='kg')
    condition = models.CharField(max_length=30, choices=CONDITION_CHOICES, default='New')
    location = models.CharField(max_length=255)
    category = models.CharField(max_length=100, default='General')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    # Accepts a URL string — suppliers can paste a product image URL.
    # File upload can be layered on top later without a DB migration.
    image_url = models.URLField(blank=True, default='')
    is_featured = models.BooleanField(default=False)
    views = models.PositiveIntegerField(default=0)
    min_order_qty = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.product_name} ({self.supplier.first_name or self.supplier.email})"

    @property
    def total_value(self):
        return float(self.price) * self.quantity

    @property
    def inquiry_count(self):
        # Count chat conversations linked to this listing
        return self.conversations.count()


class ListingPromotion(models.Model):
    """A supplier-created discount promotion on one of their listings."""
    listing          = models.OneToOneField(Listing, on_delete=models.CASCADE, related_name='promotion')
    discount_percent = models.PositiveIntegerField(help_text='1–99')
    is_active        = models.BooleanField(default=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    ends_at          = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.listing.product_name} — {self.discount_percent}% off"

    @property
    def discounted_price(self):
        return round(float(self.listing.price) * (1 - self.discount_percent / 100), 2)


class SavedListing(models.Model):
    """Tracks which listings a user has hearted/saved."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_listings')
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='saved_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'listing')

    def __str__(self):
        return f"{self.user.email} saved {self.listing.product_name}"
