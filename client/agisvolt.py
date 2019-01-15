import json
from http.client import HTTPResponse
from threading import Lock, Thread
from urllib.error import HTTPError
from urllib.request import Request, build_opener, HTTPHandler


class APIHandler:
    def __init__(self, host, device_id):
        self._device_id = device_id
        self._host = host
        self._measurements = {}
        self._lock = Lock()

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
        # Todo: make asynchronous

        def send():
            nonlocal self, callback
            with self._lock:
                if len(self._measurements) > 0:
                    try:
                        request = Request(
                            self._host + '/api/measurements/',
                            method='PUT',
                            headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'},
                            data=json.dumps({
                                'device_id': self._device_id,
                                'measurements': list(self._measurements.values())
                            }).encode(),
                        )

                        response = build_opener(HTTPHandler).open(request)  # type: HTTPResponse
                        if response.code in range(200, 300):
                            self._measurements.clear()
                            return True
                        else:
                            callback(HTTPError(
                                code=response.code,
                                url=response.geturl(),
                                hdrs=response.headers,
                                msg='Unexpected response code from API, with messsage "%s"' % response.msg,
                                fp=response.fp
                            ))
                    except Exception as e:
                        callback(e)
        Thread(target=send).start()


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
