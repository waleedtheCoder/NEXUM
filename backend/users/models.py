from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('SHOPKEEPER', 'Shopkeeper'),
        ('SUPPLIER', 'Supplier'),
        ('CUSTOMER', 'Customer'),
    )

    user           = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    firebase_uid   = models.CharField(max_length=128, unique=True)
    role           = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CUSTOMER')
    phone_number   = models.CharField(max_length=20, blank=True, null=True)
    email_verified = models.BooleanField(default=False)
    # Push notifications — registered on login via POST /api/users/fcm-token/
    fcm_token      = models.CharField(
        max_length=500,
        blank=True,
        default='',
        help_text='Firebase Cloud Messaging device token for push notifications',
    )
    profile_image_url = models.URLField(blank=True, default='')

    def __str__(self):
        return f"{self.user.username} - {self.role}"


class RestockReminder(models.Model):
    UNIT_CHOICES = [
        ('kg', 'kg'), ('bags', 'bags'), ('boxes', 'boxes'),
        ('cartons', 'cartons'), ('pieces', 'pieces'),
        ('liters', 'liters'), ('bottles', 'bottles'),
    ]
    user     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='restock_reminders')
    product  = models.CharField(max_length=255)
    quantity = models.CharField(max_length=50)
    unit     = models.CharField(max_length=20, choices=UNIT_CHOICES, default='kg')
    active   = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email}: {self.product} ({self.quantity} {self.unit})"


class FavouriteSupplier(models.Model):
    shopkeeper = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='favourite_suppliers',
    )
    supplier = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='favourited_by',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('shopkeeper', 'supplier')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.shopkeeper.username} → {self.supplier.username}"