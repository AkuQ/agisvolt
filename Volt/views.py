from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import render


class Views:
    @staticmethod
    def test():
        return HttpResponse('Hello!')
        # return HttpResponse("You're looking at question %s." % question_id)

    @staticmethod
    def testReact(request):
        return render(request, 'react.html')


def get(*args, view: str, **kwargs):
    if not hasattr(Views, view):
        return HttpResponseNotFound("Oops!")
    return getattr(Views, view)(*args, **kwargs)


