from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_userprofile_profile_image_url_restockreminder'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='verification_status',
            field=models.CharField(
                choices=[('none', 'Not Requested'), ('pending', 'Pending'), ('verified', 'Verified')],
                default='none',
                max_length=10,
            ),
        ),
    ]
