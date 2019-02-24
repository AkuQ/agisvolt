import traceback

from . import scripts

class bunch:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)


# FUNCTIONS:

def getserial():
    """
    :rtype: str
    :return: Type::Manufacturer/Model::Serial
    - Type: "SYSTEM" or "CPU" or "BOARD"
    - Manufacturer: Manufacturer ID or name or other identifier that prevents hardware ID collision.
    - Serial: The actual hardware ID.
    """
    serial, model, id_type = \
        _get_serial_from_cpuinfo() or \
        _get_serial_from_dmi('system') or \
        _get_serial_from_dmi('board') or \
        ('TEST', 'TEST', 'TEST')
    if not serial:
        raise RuntimeError("Could not find hardware ID")
    else:
        return id_type + '::' + model + '::' + serial


def _get_serial_from_cpuinfo():
    try:
        cpuinfo = scripts.cpuinfo()
        cpuinfo = dict(
            (k.strip(), v.strip()) for k, v in (
                line.split(':') for line in cpuinfo.split('\n') if ':' in line
            )
        )
        serial = cpuinfo['Serial']
        model_id = cpuinfo['Hardware']
    except (OSError, ValueError, KeyError):
        return None
    return _invalidate_bad_id(serial.strip(), model_id.strip(), 'CPU')


def _get_serial_from_dmi(id_type: str):
    try:
        info = getattr(scripts, 'dmi_%s_info' % id_type)()
        serial, model_id = info.split(',')
    except (OSError, ValueError, KeyError) as e:
        return None
    return _invalidate_bad_id(serial.strip(), model_id.strip(), id_type.upper())


def _invalidate_bad_id(ID: str, *args):
    return None if not ID or ' ' in ID or len(ID) <= 4 else tuple([ID]) + args


def trace_as_tuples(trace=None):
    """
    Returns current or specified traceback as a list of tuples.
    """
    if type(trace).__name__ == 'traceback':
        trace = traceback.extract_tb(trace)

    if not trace:
        trace = traceback.extract_stack()[:-1]
    if not isinstance(trace[0], tuple):
        trace = [(l.filename, l.lineno, l.name, l.line) for l in trace]
    return trace

