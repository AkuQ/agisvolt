from django.db import migrations

from agisvolt.constants import PERM


def global_permission(apps, schema_editor):
    from django.db.models import Model
    from django.contrib.auth.models import Permission, Group
    from django.contrib.contenttypes.models import ContentType

    class GlobalPermission(Model):
        class Meta:
            managed = False

        @staticmethod
        def create(codename: str, name: str):
            return Permission.objects.update_or_create(
                codename=codename, name=name, content_type=ContentType.objects.get_for_model(GlobalPermission)
            )[0]

    admin = Group.objects.get_or_create(name='admin')[0]
    supervisors = Group.objects.get_or_create(name='supervisors')[0]
    users = Group.objects.get_or_create(name='users')[0]
    unverified_users = Group.objects.get_or_create(name='unverified_users')[0]

    can_monitor_users = GlobalPermission.create(PERM.MONITOR_USER, 'Can monitor users')
    can_verify_users = GlobalPermission.create(PERM.VERIFY_USER, 'Can verify registered user')
    can_promote_supervisors = GlobalPermission.create(PERM.PROMOTE_USER, 'Can promote user to supervisor')

    can_monitor_devices = GlobalPermission.create(PERM.MONITOR_DEVICE, 'Can monitor sensor devices')
    can_manage_devices = GlobalPermission.create(PERM.MANAGE_DEVICE, 'Can configure devices')

    users.      permissions.add(can_monitor_devices, *unverified_users.permissions.all())
    supervisors.permissions.add(can_verify_users, *users.permissions.all())
    admin.      permissions.add(can_promote_supervisors, *supervisors.permissions.all())


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '__latest__'),
        ('Volt', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(global_permission)
    ]
