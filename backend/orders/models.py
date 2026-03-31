from django.db import models
from django.contrib.auth.models import User


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('confirmed', 'Confirmed'),
        ('shipped',   'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    buyer        = models.ForeignKey(User, on_delete=models.CASCADE,  related_name='orders')
    supplier     = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='supplier_orders', null=True)
    listing      = models.ForeignKey('listings.Listing', on_delete=models.SET_NULL, null=True)
    quantity     = models.PositiveIntegerField()
    unit_price   = models.DecimalField(max_digits=10, decimal_places=2)
    total_price  = models.DecimalField(max_digits=12, decimal_places=2)
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes        = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} — {self.buyer.username}"

    def save(self, *args, **kwargs):
        # Auto-compute total price if not explicitly set
        if not self.total_price:
            self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)


class Review(models.Model):
    order    = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='review')
    supplier = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_received')
    buyer    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    rating   = models.PositiveSmallIntegerField()   # 1–5
    text     = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review #{self.id} — {self.rating}★ by {self.buyer.email}"
