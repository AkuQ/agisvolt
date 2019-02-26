from django.db.models import Avg
from rest_framework.fields import SerializerMethodField
from rest_framework.serializers import ModelSerializer

from Volt.models import Measurement, Device


class MeasurementSerializer(ModelSerializer):
    class Meta:
        model = Measurement
        fields = '__all__'


class DeviceSerializer(ModelSerializer):
    class Meta:
        model = Device
        extra_kwargs = {
            'token': {'write_only': True}, 'salt': {'write_only': True}, 'hardware_id': {'write_only': True}
        }  # todo: considering hashing hardware IDs, considered sensitive information
        fields = '__all__'

    avg_measurements = SerializerMethodField()

    def __init__(self, *args, avg_measurement: list, agg_lookback: int=None, **kwargs):
        super().__init__(*args, **kwargs)
        self._avg_measurement = avg_measurement
        self._agg_lookback = agg_lookback

    def get_avg_measurements(self, device):
        return {
            m['label']: m['avg'] for m in Measurement.objects
            .filter(device_id=device.device_id, label__in=self._avg_measurement, timestamp__gte=self._agg_lookback)
            .order_by()  # empty order_by required for groupibf by values('label') to work  # todo: remove Measuerement.Meta order_by, move ordering clause to serializer
            .values('label')
            .annotate(avg=Avg('value'))
         }
