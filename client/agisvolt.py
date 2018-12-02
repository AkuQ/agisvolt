import json
from http.client import HTTPResponse
from urllib.request import Request, build_opener, HTTPHandler


class APIHandler:
    def __init__(self, host, device_id):
        self._device_id = device_id
        self._host = host
        self._measurements = {}

    def append_measurement(self, timestamp: int, mean_val: float, max_val: float, min_val: float):
        """
        Add 1-second resolution measurement sample.

        :param timestamp: Current time in epoch-seconds.
        :param mean_val: Aggregate value.
        :param max_val: Max. spike during the 1-second measurement.
        :param min_val: Min. spike during the 1-second measurement.
        :return:
        """
        self._measurements[timestamp] = {'timestamp': timestamp, 'mean': mean_val, 'max': max_val, 'min': min_val}

    def send_measurements(self) -> bool:
        """
        Send measurement samples to server.
        :return:
        """
        # Todo: make asynchronous
        try:
            request = Request(
                self._host + 'measurements/',
                method='PUT',
                headers={'Content-Type': 'application/json'},
                data=json.dumps({
                    'device_id': self._device_id,
                    'measurements': list(self._measurements.values())
                }).encode()
            )
            print(json.dumps({
                    'device_id': self._device_id,
                    'measurements': list(self._measurements.values())
                }).encode())
            response = build_opener(HTTPHandler).open(request)  # type: HTTPResponse
            if response.code in range(200, 300):
                self._measurements.clear()
                return True
            else:
                return False
        except Exception:
            return False


# # Sample code (generate fake random datapoints and send them instantly):
#
# from random import random
# from time import sleep, time
#
#
# api = APIHandler('http://localhost:8000/api/', 100)
# last_timestamp = 0
# while 1:
#     now = int(time())
#     if now > last_timestamp:
#         value = random() * 12.0
#         api.append_measurement(now, value, value+random(), value-random())
#         success = api.send_measurements()
#         not success and print("Warning: API call failed.")
#         last_timestamp = now
#     sleep(.1)
