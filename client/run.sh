#! /bin/sh
### BEGIN INIT INFO
# Provides:          agis
# Required-Start:    $all
# Required-Stop:
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Start agis
# Description:       Start agis as default UI of an embedded device
### END INIT INFO

sudo startx /usr/bin/python3 /var/agis --kiosk "$@"
clear > /dev/tty1 2>&1
