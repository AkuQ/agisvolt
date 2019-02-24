from base64 import b64encode
from hashlib import sha256, md5

from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.db.models import Model
from django.db.models import \
    BigAutoField    as BigAuto, \
    ForeignKey      as Foreign, \
    BigIntegerField as BigInteger, \
    FloatField      as Float, \
    CharField       as Char, \
    IntegerField    as Integer

from rest_framework.serializers import ModelSerializer

from agisvolt.settings import SECRET_KEY


class Device(Model):
    SERVICE = 0
    RUNNING = 1
    BLOCKED = 2

    device_id = BigAuto(primary_key=True)
    hardware_id = Char(unique=True, max_length=255)
    mode = Integer(default=SERVICE, choices={
        (SERVICE, 'Service'),
        (RUNNING, 'Running'),
        (BLOCKED, 'Blacklisted'),
    })

    name = Char(max_length=256, default='')
    description = Char(max_length=1024, default='')
    lat = Float(null=True)
    lon = Float(null=True)

    token = Char(max_length=256)
    salt = Char(max_length=64)

    def authenticate(self, token):
        return self.token == self.hash256(token, self.salt)

    @staticmethod
    def hash256(p, s):
        salt_md5 = md5()
        salt_md5.update(s.encode())
        salt_md5 = salt_md5.hexdigest()
        return b64encode(sha256((SECRET_KEY + p + salt_md5).encode()).digest()).decode()


class DeviceSerializer(ModelSerializer):
    class Meta:
        model = Device
        extra_kwargs = {
            'token': {'write_only': True}, 'salt': {'write_only': True}, 'hardware_id': {'write_only': True}
        }  # todo: considering hashing hardware IDs, considered sensitive information
        fields = '__all__'


class Measurement(Model):
    class Meta:
        unique_together = (('device_id', 'timestamp', 'label'),)
        ordering = ['timestamp']

    measurement_id = BigAuto(primary_key=True)
    device_id = Foreign(Device, on_delete=models.CASCADE, db_column='device_id')
    timestamp = BigInteger()
    value = Float()
    label = Char(max_length=128, default='')
