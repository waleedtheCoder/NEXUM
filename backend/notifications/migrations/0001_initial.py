from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id',               models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type',             models.CharField(
                    choices=[
                        ('inquiry', 'Inquiry'), ('price', 'Price Alert'),
                        ('restock', 'Restock Reminder'), ('supplier', 'New Supplier'),
                        ('promo', 'Promotion'), ('system', 'System'),
                    ],
                    default='system', max_length=20,
                )),
                ('title',            models.CharField(max_length=255)),
                ('body',             models.TextField()),
                ('is_read',          models.BooleanField(default=False)),
                ('conversation_id',  models.IntegerField(blank=True, null=True)),
                ('listing_id',       models.IntegerField(blank=True, null=True)),
                ('created_at',       models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='notifications',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'ordering': ['-created_at']},
        ),
    ]
