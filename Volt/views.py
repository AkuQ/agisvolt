import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User, Permission, Group
from django.http import HttpResponse, HttpResponseNotFound, HttpRequest, HttpResponseRedirect
from django.shortcuts import render


class Views:
    @staticmethod
    def index(request: HttpRequest):
        if request.user.is_authenticated:
            return render(request, 'index.html')
        else:
            return HttpResponseRedirect('/login')

    @staticmethod
    def testReact(request: HttpRequest):
        return render(request, 'demo.html')

    @staticmethod
    def register(request: HttpRequest):
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
    def login(request: HttpRequest):
        data = json.loads(request.body.decode() or '{}')  # type: dict
        username = data.get('email', '')
        password = data.get('password', '')

        user = authenticate(request, username=username, password=password)

        if request.user.is_authenticated:
            return HttpResponseRedirect('/', status=302)
        elif user is not None:
            login(request, user)
            return HttpResponseRedirect('/', status=302)
        elif request.method.upper() == 'GET':
            return render(request, 'login.html')
        return HttpResponseNotFound()

    @staticmethod
    def logout(request: HttpRequest):
        logout(request)
        return HttpResponseRedirect('/login', status=302)


def get(*args, view='index', **kwargs):
    if hasattr(Views, view):
        return getattr(Views, view)(*args, **kwargs)
    else:
        return HttpResponseNotFound("Page does not exist.")
