import json
from http.client import HTTPResponse
from json import JSONDecodeError
from threading import Lock, Thread
from urllib.error import HTTPError
from urllib.request import Request, build_opener, HTTPHandler

from client.utils import getserial


class APIHandler:
    def __init__(self, host):
        self._state = None

        self._host = host
        self._measurements = {}
        self._lock = Lock()

        self._hardware_id = getserial()
        self._load()

    @property
    def device_id(self):
        return self._state['device_id']

    @property
    def token(self):
        return self._state['token']

    @property
    def hardware_id(self):
        return self._hardware_id

    def _load(self):
        try:
            with open('agisvolt.json', 'r') as f:
                self._state = json.load(f)
        except (JSONDecodeError, IOError):
            self._state = {'device_id': None, 'token': None}

    def _save(self):
        state = self._state.copy()
        try:
            with open('agisvolt.json', 'w') as f:
                f.writelines(json.dumps(state))
            self._state = state
            return True
        except IOError:
            return False
            # todo: cancel register if device_id changed (presumably from None to brand new ID)

    def _api_call(self, method: str, route: str, content: dict) -> (dict, Exception):
        try:
            content.update({k: v for k, v in {
                'device_id': self.device_id,
                'token': self.token,
            }.items() if v is not None})

            request = Request(self._host + route, method=method, data=json.dumps(content).encode(), headers={
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            })

            response = build_opener(HTTPHandler).open(request)  # type: HTTPResponse
            if response.code in range(200, 300):
                return json.loads(response.readlines()[0].decode()), None
            else:
                return None, HTTPError(
                    code=response.code,
                    url=response.geturl(),
                    hdrs=response.headers,
                    msg='Unexpected response code from API, with messsage "%s"' % response.msg,
                    fp=response.fp
                )
        except Exception as e:
            return None, e

    def append_measurement(self, timestamp: int, value: float, label=''):
        """
        Add 1-second resolution measurement sample.

        :param timestamp: Current time in epoch-seconds.
        :param value: Max. spike during the 1-second measurement.
        :param label: Adding a label that's unique with timestamps allows for multiple data points per timestamp.
        """
        key = "%d|%s" % (timestamp, label)
        self._measurements[key] = {'timestamp': timestamp, 'value': value, 'label': label}

    def send_measurements(self, callback: lambda err: None):
        """
        Send measurement samples to server asynchronously.

        :param callback: Callback function for handling potential errors, in normal operation recieves None or HTTPError
            as first parameter.
        """
        def send():
            nonlocal self, callback
            with self._lock:
                if len(self._measurements) > 0:
                    res, err = self._api_call('POST', '/api/measurements/', {
                        'measurements': list(self._measurements.values())
                    })
                    if err:
                        callback(err)
                    else:
                        self._measurements.clear()
        Thread(target=send).start()

    def register(self):
        res, err = self._api_call('PUT', '/api/devices/', {'hardware_id': self.hardware_id})
        if not err:
            for k, v in res.items():
                if k in self._state:
                    self._state[k] = v

            self._save()  # todo: if not save cancel registration
            return True
        else:
            return False


# # Sample code (generate fake random datapoints and send them instantly):
#
# from random import random
# from time import sleep, time
#
#
# api = APIHandler('http://agis.innocode.fi', 100)
# last_timestamp = 0
# while 1:
#     now = int(time())
#     if now > last_timestamp:
#         value = random() * 12.0
#         api.append_measurement(now, value, 'mean')
#         api.append_measurement(now, value+random(), 'max_error')
#         api.append_measurement(now, value-random(), 'min_error')
#         api.send_measurements(lambda err: err is not None and print("Warning: API call failed."))
#         last_timestamp = now
#     sleep(.1)
