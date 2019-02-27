
from time import sleep, time

from .agisvolt import APIHandler
from .gpio import Voltmeter


api = APIHandler('http://agis.innocode.fi')
while not api.register():
    print('Warning: Could not register device')
    sleep(5)

voltmeter = Voltmeter()
voltmeter.open()
voltmeter.set_clock_mode()

ref = 2500
voltage = 11*0.5*ref
current = 0.25*0.5*ref

last_timestamp = 0
data = None
voltmeter.set_channel(8, False)
try:
    while 1:
        done = False
        while not done:
            conversion, overflow, rawbits = voltmeter.get_conversion()
            if conversion is None:
                sleep(0.1)
            else:
                percent = conversion / (2 ** 15)
                result = percent * voltage
                print("%s mV" % (str(result) if not overflow else "OVERFLOW"))
                data = result
                done = True

        now = int(time())
        if now > last_timestamp:
            api.append_measurement(now, data / 1000.0, 'Voltage')
            ii = 0
            api.send_measurements(lambda err: err and print("Warning: API call failed."))
            last_timestamp = now
        sleep(.1)
except KeyboardInterrupt:
    pass

api.append_measurement(last_timestamp + 1, None, 'Voltage')
api.send_measurements(lambda err: err and print("Warning: API call failed."))

voltmeter.close()


# from agisvolt import APIHandler
# from gpio import Voltmeter
# from time import sleep, time
#
# voltmeter = Voltmeter()
# voltmeter.open()
# voltmeter.set_clock_mode()
#
# # print([True] * 8 + [False] * 8)
# # exit(list(range(0, 16)) * 2)
#
# channels = list(zip(list(range(0, 16)) * 2, [True] * 16 + [False] * 16))
# ref = 2500
# voltage = 11*0.5*ref
# current = 0.25*0.5*ref
#
# api = APIHandler('http://agis.innocode.fi')
# while not api.register():
#     print('Warning: Could not register device')
#     sleep(5)
#
# last_timestamp = 0
# try:
#     while 1:
#         print(list(channels))
#         data = []
#         for ch, use_2nd_channel in channels:
#             ch2 = str(-(ch + 1 - (ch % 2) * 2)) if use_2nd_channel else 'COM'
#             print('Channel +%d / %s:' % (ch, ch2))
#             voltmeter.set_channel(ch, use_2nd_channel)
#             done = False
#             while not done:
#                 conversion, overflow, rawbits = voltmeter.get_conversion()
#                 #return value, overflow, data
#                 if conversion is None:
#                     sleep(0.1)
#                 else:
#                     percent = conversion/(2**15)
#                     result = 0
#                     if use_2nd_channel:
#                         #if float(current) > 0:
#                         result = percent * current
#                         if result > 0:
#                             print("%s mA" % (str(result) if not overflow else "OVERFLOW"))
#                         else:
#                             result = 0
#                             print("%s mA" % (str(result) if not overflow else "OVERFLOW"))
#                     else:
#                         result = percent * voltage
#                         print("%s mV" % (str(result) if not overflow else "OVERFLOW"))
#                     print("\n")
#                     data.append(result)
#                     done = True
#
#         now = int(time())
#         if now > last_timestamp:
#             ii = 0
#             while ii < len(data):
#                 if float(data[ii]) > 0: #and (ii == 1 or ii == 3 or ii == 5 or ii == 6 or ii == 10):
#                     print("%s ch - value %s" % (ii, data[ii]))
#                     api.append_measurement(now, data[ii], ii)
#                 ii += 1
#             success = api.send_measurements(lambda err: err and print("Warning: API call failed."))
#             last_timestamp = now
#         sleep(.1)
#
# except KeyboardInterrupt:
#     pass
#
# voltmeter.close()
