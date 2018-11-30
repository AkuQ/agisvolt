from django.http import HttpResponse, HttpResponseNotFound, HttpRequest
from django.shortcuts import render


class Views:
    @staticmethod
    def test(request: HttpRequest):
        return HttpResponse(str(request.get_host()))

    @staticmethod
    def testReact(request: HttpRequest):
        return render(request, 'react.html', {'api': request.get_host() + '/api/'})


def get(*args, view: str, **kwargs):
    if hasattr(Views, view):
        return getattr(Views, view)(*args, **kwargs)
    else:
        return HttpResponseNotFound("Page does not exist.")
