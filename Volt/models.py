from django.db import models
from django.db.models import Model
from django.db.models import \
    BigAutoField    as BigAuto, \
    ForeignKey      as Foreign, \
    BigIntegerField as BigInteger, \
    FloatField      as Float, \
    CharField       as Char


class Device(Model):
    device_id = BigAuto(primary_key=True)


class Measurement(Model):
    class Meta:
        unique_together = (('device_id', 'timestamp'),)
        ordering = ['timestamp']

    measurement_id = BigAuto(primary_key=True)
    device_id = Foreign(Device, on_delete=models.CASCADE, db_column='device_id')
    timestamp = BigInteger()
    mean = Float()
    max = Float()
    min = Float()
