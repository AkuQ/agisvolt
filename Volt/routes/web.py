import json
from random import random
from time import time

from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User, Group
from django.db.models import Q
from django.http import HttpRequest as Request, JsonResponse, HttpResponseRedirect, HttpResponseBadRequest
from django.http import HttpResponseForbidden
from django.shortcuts import render
from django.views import View

from agisvolt.constants import PERM

from Volt.models import Device, Measurement
from Volt.routes import RouteMeta
from Volt.serializers import DeviceSerializer


class WebAPI(metaclass=RouteMeta):
    @staticmethod
    def register(request: Request):
        data = json.loads(request.body.decode() or '{}')  # type: dict

        user = User.objects.create_user(
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            username=data.get('email', ''),
            password=data.get('password', ''),
            email=data.get('email', ''),
        )
        user.groups.add(Group.objects.get(name='unverified_users'))
        return render(request, 'login.html')

    @staticmethod
    def login(request: Request):
        data = json.loads(request.body.decode() or '{}')  # type: dict
        username = data.get('email', '')
        password = data.get('password', '')

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return HttpResponseRedirect('/')
        return HttpResponseBadRequest(status=401)

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

        def put(self):
            pass

    class measurements(View):
        def get(self, request: Request):
            if not request.user.has_perm(PERM.MONITOR_DEVICE):
                return HttpResponseForbidden()

            def test_randoms(start=0, end=None):
                now = int(time())
                if end is None: end = now
                end = min(now, int(end))
                start = max(now - 60, int(start))

                ret = []
                for t in range(start, end + 1):
                    for k, v in {'t1': random() * 10, 't2': random() * 10, 't3': random() * 10 - 5}.items():
                        ret.append({'timestamp': t, 'value': v, 'label': k})
                    if random() > .5:
                        ret.append({'timestamp': t, 'value': 2, 'label': 't4'})
                    for k, v in {'t1': random() * 5, 't2': random() * 5, 't3': random() * 5 - 3}.items():
                        ret.append({'timestamp': t, 'value': v, 'label': k + '|B'})
                return ret

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
