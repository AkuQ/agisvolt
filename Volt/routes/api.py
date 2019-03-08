import json

from django.db import transaction, IntegrityError
from django.http import HttpRequest as Request
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseForbidden, HttpResponseNotFound
from django.views import View
from django.utils.crypto import get_random_string
from django.contrib.gis.geoip2 import GeoIP2

from agisvolt.constants import PERM
from Volt.models import Measurement, Device
from Volt.emails import SendEmail

from Volt.routes import RouteMeta


class API(metaclass=RouteMeta):
    class devices(View):
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
