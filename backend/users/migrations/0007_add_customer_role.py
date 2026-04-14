from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_userprofile_verification_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='role',
            field=models.CharField(
                choices=[
                    ('SHOPKEEPER', 'Shopkeeper'),
                    ('SUPPLIER', 'Supplier'),
                    ('CUSTOMER', 'Customer'),
                    ('ADMIN', 'Admin'),
                ],
                default='CUSTOMER',
                max_length=20,
            ),
        ),
    ]
