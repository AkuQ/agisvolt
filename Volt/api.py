import json

from django.db import transaction, IntegrityError
from django.db.models import Q
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
        _from, _to = params.get('from', 0), params.get('to', None)

        filters = [
            Q(device_id=device_id),
            Q(timestamp__gte=_from)
        ]
        _to and filters.append(Q(timestamp__lte=_to))

        measurements = Measurement.objects.filter(*filters).values('timestamp', 'value', 'label')
        return JsonResponse({'measurements': list(measurements)})

