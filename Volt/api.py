import json
from random import random
from time import time

from django.contrib.auth.decorators import permission_required
from django.db import transaction, IntegrityError
from django.db.models import Q
from django.http import HttpRequest as Request
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseForbidden, HttpResponseNotFound
from django.views import View
from django.utils.crypto import get_random_string
from django.contrib.gis.geoip2 import GeoIP2

from agisvolt.constants import PERM
from .models import Measurement, Device, DeviceSerializer


def test_randoms(start=0, end=None):
    now = int(time())
    if end is None: end = now
    end = min(now, int(end))
    start = max(now - 60, int(start))

    ret = []
    for t in range(start, end + 1):
        for k, v in {'t1': random()*10, 't2': random()*10,  't3': random()*10 - 5}.items():
            ret.append({'timestamp': t, 'value': v, 'label': k})
        if random() > .5:
            ret.append({'timestamp': t, 'value': 2, 'label': 't4'})
        for k, v in {'t1': random() * 5, 't2': random() * 5, 't3': random() * 5 - 3}.items():
            ret.append({'timestamp': t, 'value': v, 'label': k + '|B'})
    return ret


class devices(View):
    def get(self, request: Request):
        if not request.user.has_perm(PERM.MONITOR_DEVICE):
            return HttpResponseForbidden()

        devices = DeviceSerializer(
            Device.objects.all(),
            many=True,
            avg_measurement=['Voltage'],
            agg_lookback=int(time() - 10)
        )
        return JsonResponse({'devices': devices.data})

    def put(self, request: Request):
        params = json.loads(request.body.decode())  # type: dict
        # todo: validation, require hardware_ids

        if params.get('device_id', False):
            device = Device.objects.filter(device_id=params.get('device_id')).first()
            if device:
                return JsonResponse({'auth': device.authenticate(params.get('token', ''))})
            # todo
        else:
            device = Device.objects.filter(hardware_id=params.get('hardware_id')).first()
            if device:
                return JsonResponse({'auth': device.authenticate(params.get('token', ''))})
            # todo

        # Register new:
        hardware_id = params['hardware_id']

        # generate token:
        token = get_random_string(128)
        salt = get_random_string(32)
        hashed = Device.hash256(token, salt)

        # Locate:
        coordinates = params.get('coordinates', False)
        if not coordinates:
            coordinates = GeoIP2().lat_lon(request.META.get('REMOTE_ADDR', None))

        device = Device.objects.create(
            token=hashed, hardware_id=hardware_id, salt=salt, lat=coordinates[0], lon=coordinates[1])
        device.name = "Device %d" % device.device_id
        device.save()

        return JsonResponse({'device_id': device.device_id, "token": token})


class measurements(View):
    def post(self, request: Request):
        params = json.loads(request.body.decode())  # type: dict
        device_id = params.get('device_id', None)
        measurements = params.get('measurements', [])

        device = Device.objects.filter(device_id=device_id).first()
        if not device:
            return HttpResponseNotFound()
        if not device.authenticate(params.get('token', '')):
            return HttpResponseForbidden()

        try:
            with transaction.atomic():
                for measurement_data in measurements:
                    Measurement(device_id=device, **measurement_data).save()
        except IntegrityError as e:
            return HttpResponseBadRequest(str(e))
        return JsonResponse({'count': len(measurements)})

    def get(self, request: Request):
        if not request.user.has_perm(PERM.MONITOR_DEVICE):
            return HttpResponseForbidden()

        params = request.GET.dict()  # type: dict
        device_id = params.get('device_id', 0)
        _from, _to = params.get('from', 0), params.get('to', None)

        if device_id == 'TEST':
            return JsonResponse({'measurements': test_randoms(_from, _to)})

        filters = [
            Q(device_id=device_id),
            Q(timestamp__gte=_from)
        ]
        _to and filters.append(Q(timestamp__lte=_to))

        measurements = Measurement.objects.filter(*filters).values('timestamp', 'value', 'label')
        return JsonResponse({'measurements': list(measurements)})


