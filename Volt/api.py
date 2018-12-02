import json

from django.db import transaction, IntegrityError
from django.http import HttpRequest as Request, HttpResponse, JsonResponse, HttpResponseBadRequest
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import View

from .models import Measurement, Device


# noinspection PyMethodMayBeStatic
@method_decorator(csrf_exempt, name='dispatch')
class measurements(View):
    def put(self, request: Request):
        params = json.loads(request.body.decode())  # type: dict
        device_id = params.get('device_id', None)
        measurements = params.get('measurements', [])

        try:
            device, was_created = Device.objects.get_or_create(device_id=device_id)
            with transaction.atomic():
                for measurement_data in measurements:
                    Measurement(device_id=device, **measurement_data).save()
        except IntegrityError as e:
            return HttpResponseBadRequest(str(e))
        return JsonResponse({'count': len(measurements)})

    def get(self, request: Request):
        params = request.GET.dict()  # type: dict
        device_id = params.get('device_id', 0)
        since = params.get('from', 0)
        measurements = Measurement.objects\
            .filter(device_id=device_id, timestamp__gte=since)\
            .values('timestamp', 'mean', 'max', 'min')
        return JsonResponse({'measurements': list(measurements)})
