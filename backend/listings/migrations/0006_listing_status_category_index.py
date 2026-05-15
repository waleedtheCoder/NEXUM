from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0005_listingimage'),
    ]

    operations = [
        migrations.AlterField(
            model_name='listing',
            name='category',
            field=models.CharField(db_index=True, default='General', max_length=100),
        ),
        migrations.AlterField(
            model_name='listing',
            name='status',
            field=models.CharField(
                choices=[('active', 'Active'), ('pending', 'Pending'), ('removed', 'Removed')],
                db_index=True,
                default='pending',
                max_length=20,
            ),
        ),
    ]
