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

    def __str__(self):
        return f"{self.user.username} - {self.role}"