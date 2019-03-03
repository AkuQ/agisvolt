from django.http import HttpResponseNotFound


class RouteMeta(type):
    def __call__(cls, *args, path: str='index', **kwargs):
        route = cls
        for part in [part for part in path.split('/') if part]:
            if hasattr(route, part):
                route = getattr(route, part)
            else:
                return HttpResponseNotFound("Page does not exist.")
        if type(route) == type:
            route = route.as_view()
        return route(*args, **kwargs)
