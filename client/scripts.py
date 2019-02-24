import subprocess
import shlex
import re

_scripts = {
    'cpuinfo':
        'cat /proc/cpuinfo',
    'disable_screensaver':
        'xset -dpms; xset s off; xset s noblank;',
    'dmi_board_info':
        'sudo paste -d "," /sys/class/dmi/id/board_serial /sys/class/dmi/id/board_vendor',
    'dmi_system_info':
        'sudo paste -d "," /sys/class/dmi/id/product_serial /sys/class/dmi/id/sys_vendor',
    'reboot':
        'sleep 10s; sudo shutdown -r now',
    'local_address':
        'ifconfig eth0; ifconfig wlan0;' #| grep -Po "(?<=inet addr:)([[:digit:]]{1,3}\.){3}[[:digit:]]{1,3}"
}


def cpuinfo():
    return run_script(_scripts['cpuinfo'], True)


def disable_screensaver():
    return run_script(_scripts['disable_screensaver'], False)


def dmi_board_info():
    return run_script(_scripts['dmi_board_info'], True)


def dmi_system_info():
    return run_script(_scripts['dmi_system_info'], True)


def reboot():
    subprocess.Popen(_scripts['reboot'], shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    # return run_script(_scripts['reboot'], sync=True)


def local_address():
    ret = run_script(_scripts['local_address'], True)
    if ret: ret = ret[0]
    matches = re.findall("(?<=inet addr:)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})", ret)
    return matches[0] if matches else ""


def run_script(script: str, communicates=False, sync=True):
    # SUB:
    # noinspection PyShadowingNames
    def parse_script(script: str):
        in_commented = script.strip().startswith('\"')
        script = script.split('\"')
        subscripts = ['']
        current_line = 0
        for s in script:
            if in_commented:
                subscripts[current_line] += ' "%s"' % s
            else:
                for c in s.split(';'):
                    c = c.strip()
                    if c:
                        subscripts.append(c)
                current_line = len(subscripts) - 1
            in_commented = not in_commented

        return [shlex.split(line) for line in subscripts if line]
    # noinspection PyShadowingNames
    # def run_sync(commands: list):
    #     processes = []
    #     return processes
    # # noinspection PyShadowingNames
    # def run_async(commands: list):
    #     processes = []
    #     for command in commands:
    #         processes += [subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)]
    #     return processes

    # MAIN:
    commands = parse_script(script)

    processes = []
    for command in commands:
        processes += [subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)]

    # if sync:
    #     processes = run_sync(script)
    # else:
    #     processes = run_async(script)

    if communicates:
        results = [process.communicate()[0].decode() for process in processes]
        if len(commands) == 1:
            return results[0]
        elif len(commands) > 1:
            return results
    else:
        return None
