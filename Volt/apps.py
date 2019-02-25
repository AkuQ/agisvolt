from django.apps import AppConfig
from django.utils import autoreload

import uwsgi
from uwsgidecorators import timer

from agisvolt.settings import DEBUG


class VoltConfig(AppConfig):
    name = 'Volt'

    if DEBUG:
        @timer(3)
        def change_code_gracefull_reload(sig):
            if autoreload.code_changed():
                uwsgi.reload()
