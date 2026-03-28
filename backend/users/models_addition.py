# ─────────────────────────────────────────────────────────────────────────────
# ADD this field to the UserProfile model in users/models.py
# Then run:  python manage.py makemigrations users
#            python manage.py migrate
# ─────────────────────────────────────────────────────────────────────────────

# In users/models.py, add inside the UserProfile class:
#
#   fcm_token = models.CharField(
#       max_length=500,
#       blank=True,
#       default='',
#       help_text='Firebase Cloud Messaging device token for push notifications',
#   )
#
# Full updated UserProfile for reference:

from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('shopkeeper', 'Shopkeeper'),
        ('supplier',   'Supplier'),
        ('customer',   'Customer'),
    ]

    user           = models.OneToOneField(User, on_delete=models.CASCADE)
    firebase_uid   = models.CharField(max_length=128, unique=True)
    role           = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    phone_number   = models.CharField(max_length=20, blank=True)
    email_verified = models.BooleanField(default=False)

    # ↓↓↓  NEW — add this field  ↓↓↓
    fcm_token      = models.CharField(
        max_length=500,
        blank=True,
        default='',
        help_text='Firebase Cloud Messaging device token for push notifications',
    )

    def __str__(self):
        return f"{self.user.username} ({self.role})"
