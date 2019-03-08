from django.contrib.auth import logout
from django.http import HttpRequest as Request
from django.http import HttpResponseRedirect
from django.shortcuts import render

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
    def login(request: Request):
        if request.user.is_authenticated:
            return HttpResponseRedirect('/')
        else:
            return render(request, 'login.html')

    @staticmethod
    def logout(request: Request):
        logout(request)
        return HttpResponseRedirect('/login')
