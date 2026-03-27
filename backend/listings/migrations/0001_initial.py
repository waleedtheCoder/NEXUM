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
            name='Listing',
            fields=[
                ('id',          models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('product_name', models.CharField(max_length=255)),
                ('description',  models.TextField(blank=True, default='')),
                ('price',        models.DecimalField(decimal_places=2, max_digits=12)),
                ('quantity',     models.PositiveIntegerField()),
                ('unit',         models.CharField(
                    choices=[
                        ('kg', 'kg'), ('liters', 'liters'), ('pieces', 'pieces'),
                        ('boxes', 'boxes'), ('cartons', 'cartons'), ('bags', 'bags'), ('bottles', 'bottles'),
                    ],
                    default='kg', max_length=20,
                )),
                ('condition', models.CharField(
                    choices=[
                        ('New', 'New'), ('Bulk Wholesale', 'Bulk Wholesale'), ('Clearance Stock', 'Clearance Stock'),
                    ],
                    default='New', max_length=30,
                )),
                ('location',   models.CharField(max_length=255)),
                ('category',   models.CharField(default='General', max_length=100)),
                ('status',     models.CharField(
                    choices=[('active', 'Active'), ('pending', 'Pending'), ('removed', 'Removed')],
                    default='pending', max_length=20,
                )),
                ('image_url',   models.URLField(blank=True, default='')),
                ('is_featured', models.BooleanField(default=False)),
                ('views',       models.PositiveIntegerField(default=0)),
                ('created_at',  models.DateTimeField(auto_now_add=True)),
                ('updated_at',  models.DateTimeField(auto_now=True)),
                ('supplier', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='listings',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='SavedListing',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('listing', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='saved_by',
                    to='listings.listing',
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='saved_listings',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='savedlisting',
            unique_together={('user', 'listing')},
        ),
    ]
