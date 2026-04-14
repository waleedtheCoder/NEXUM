from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0003_listing_min_order_qty'),
    ]

    operations = [
        migrations.AddField(
            model_name='listing',
            name='cities',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
