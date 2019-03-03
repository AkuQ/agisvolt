import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User, Permission, Group
from django.http import HttpRequest as Request
from django.http import HttpResponse, HttpResponseNotFound, HttpResponseRedirect, HttpResponseBadRequest
from django.shortcuts import render
from django.views import View

from Volt.routes import RouteMeta


class Views(metaclass=RouteMeta):
    @staticmethod
    def index(request: Request):
        if request.user.is_authenticated:
            return render(request, 'index.html')
        else:
            return HttpResponseRedirect('/login')

    @staticmethod
    def demo(request: Request):
        return render(request, 'demo.html')

    @staticmethod
    def devices(request: Request):
        return render(request, 'devices.html')

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

    class _register:
        def post(self, request: Request):
            data = json.loads(request.body.decode() or '{}')  # type: dict

            user = User.objects.create_user(
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                username=data.get('email', ''),
                password=data.get('password', ''),
                email=data.get('email', ''),
            )
            # user.groups.add(Group.objects.get(name='unverified_users'))
            return render(request, 'login.html')

        def get(self, request: Request):
            params = request.GET.dict()  # type: dict

            return HttpResponseRedirect('/')

    class login(View):
        def get(self, request: Request):
            if request.user.is_authenticated:
                return HttpResponseRedirect('/')
            else:
                return render(request, 'login.html')

        def post(self, request: Request):
            data = json.loads(request.body.decode() or '{}')  # type: dict
            username = data.get('email', '')
            password = data.get('password', '')

            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return HttpResponseRedirect('/')
            return HttpResponseBadRequest(status=401)

    @staticmethod
    def logout(request: Request):
        logout(request)
        return HttpResponseRedirect('/login')
