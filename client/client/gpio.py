from time import sleep
import RPi.GPIO as GPIO


# noinspection PyAttributeOutsideInit,PyPep8Naming
class Voltmeter:
    def __init__(self):
        self._cs = 8
        self._miso = 9
        self._mosi = 10
        self._sck = 11
        self._led = 17
        self._max_sck_freq = 2000 * 1000  # 2000 kHz
        self._min_sck_period = 250 / 10**9  # 250 ns
        self._cs_delay = 50 / 10**9  # 50 ns

    @property
    def CS(self):
        return GPIO.input(self._cs)

    @CS.setter
    def CS(self, value):
        if self.CS != value:
            GPIO.output(self._cs, value)
            sleep(self._cs_delay * 2)

    @property
    def MISO(self):
        CS = self.CS
        self.SCK = 0
        self.CS = 0
        ret = 0
        for i in range(19):
            ret <<= 1
            self.SCK = 1
            ret |= GPIO.input(self._miso)
            self.SCK = 0
        self.CS = CS
        return ret

    @property
    def MOSI(self):
        return GPIO.output(self._mosi)

    @MOSI.setter
    def MOSI(self, value):
        CS = self.CS
        self.SCK = 0
        self.CS = 0
        while self.EOC == 1:
            pass

        for i in range(8)[::-1]:
            GPIO.output(self._mosi, (value >> i) & 1)
            self.SCK = 1
            self.SCK = 0
        GPIO.output(self._mosi, 0)
        self.CS = CS

    @property
    def EOC(self):
        CS = self.CS
        self.CS = 0
        EOC = GPIO.input(self._miso)
        self.CS = CS
        return EOC

    @property
    def SCK(self):
        return GPIO.input(self._sck)

    @SCK.setter
    def SCK(self, value):
        GPIO.output(self._sck, value)
        sleep(self._min_sck_period)

    @property
    def LED(self):
        return not GPIO.input(self._led)

    @LED.setter
    def LED(self, value):
        GPIO.output(self._led, not value)

    def open(self):
        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(True)
        GPIO.setup(self._cs, GPIO.OUT)
        GPIO.setup(self._miso, GPIO.IN)
        GPIO.setup(self._mosi, GPIO.OUT)
        GPIO.setup(self._sck, GPIO.OUT)
        GPIO.setup(self._led, GPIO.OUT)

    def close(self):
        self.LED = 0
        GPIO.cleanup()

    def set_clock_mode(self):
        self.SCK = 0
        self.CS = 0
        self.CS = 1

    def set_channel(self, channel: int, compare_to_adjacent: False):
        """
        :param channel: The positive channel to use (0-15)
        :param compare_to_adjacent: Whether to use the adjacent channel or the general COM line as negative channel.
        Channel 0 is adjacent to 1 and vice versa (and 2 to 3, and 4 to 5, etc.).
        :return:
        """
        control = 0b101
        single_ch = 0 if compare_to_adjacent else 1
        odd_ch = channel % 2
        ch = int(channel / 2)
        bits = control << 5 | single_ch << 4 | odd_ch << 3 | ch << 0
        self.MOSI = bits

    def get_conversion(self):
        self.CS = 0
        if self.EOC == 0:
            data = self.MISO
            #print(bin(data)[2:].rjust(19, '0'))
            value = data & (2**16 - 1)
            #print(str(value))
            value = -value if (data >> 15) & 0b1 else value
            overflow = ((data >> 15) ^ (data >> 16)) & 0b1 == 0

            if (data >> 17) & 0b1:
                raise IOError()

            # print(bin(data)[2:].rjust(19, '0'))
        else:
            data = None
            overflow = None
            value = None
        self.CS = 1
        return value, overflow, data

def raises(e: Exception): raise e

