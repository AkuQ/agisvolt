import os
import uuid
import json

from django.contrib.auth.context_processors import PermWrapper
from django.template import RequestContext
from django.contrib.auth.models import User, AnonymousUser
from django import template
from django.utils.html import escapejs

from agisvolt import settings


register = template.Library()


@register.simple_tag(takes_context=True)
def context_json(context: RequestContext):
    js = {}
    for k, c in context.flatten().items():
        if isinstance(c, dict):
            js[k] = c
        elif isinstance(c, User):
            js[k] = {
                'name': c.username,
                'email': c.email,
                'is_authenticated': c.is_authenticated,
            }
        elif isinstance(c, AnonymousUser):
            js[k] = {
                'name': c.username,
                'is_authenticated': c.is_authenticated,
            }
        elif isinstance(c, PermWrapper):
            js[k] = {str(p).split('.', 1)[1]: True for p in c.user.get_all_permissions()}
        else:
            js[k] = str(c)

    return escapejs(json.dumps(js))


@register.simple_tag()
def debug_decache():

    if settings.DEBUG:
        version = uuid.uuid1()
    else:
        version = os.environ.get('PROJECT_VERSION')
        if version is None:
            version = '1'
    return '?__v__={version}'.format(version=version)
