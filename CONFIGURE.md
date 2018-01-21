# Configuring DCS USB Serial devices on Ubuntu Linux

## NOTE:
The information in this document is preliminary and believed to be correct in
all cases. It has received limited testing. If you use this method, we would
appreciate feedback on your experience with this method.
---
This document provides information and a process for configuring USB
serial devices.

This method of specifying devices requires that you use the same
device configuration always. A device must always be plugged into
the same port it was originally mapped to - not doing this will require
you to re-execute this process. We recommend labeling USB ports and
connectors.

On the other hand, there is no need to connect device in a particular
order.

Steps
1) Start with the computer off, make sure all the USB devices are unplugged.
2) Boot the computer and open a terminal.
3) Plug in the first device, and type the command ```ls -lR /dev/serial/by-path```
you should see output like this:

```
dave@boots:~$ ls -lR /dev/serial/by-path
/dev/serial/by-path:
total 0
lrwxrwxrwx 1 root root 13 Feb 20 10:54 pci-0000:00:14.0-usb-0:4:1.0-port0 -> ../../ttyUSB0
dave@boots:~$
```
Note the device name (pci-0000:00:14.0-usb-0:4:1.0-port0) and the device that you
connected.
4) Repeat step 3, plugging devices in one by one and noting the device name and device
for each one.
5) When complete you have a list of all the devices and their devices names by
path.
6) Open up the configuration file in the ops subdirectory (typically config.json) in
the editor of your choice. For each of the devices you will replace it's interface
name with the FULL path of the device you noted above. If the above case was the 
serial interface for the OBD-II reader, we would modify its entry in config.json to 
something like this:
```
    {
      "description": "serial OBD-II reader",
      "path": "../serial-obd2/serial-obd2.js",
      "options": [ "--interface=/dev/serial/by-path/pci-0000:00:14.0-usb-0:4:1.0-port0"],
      "respawn": true
    },

```
7) When done, save the file, reboot the system and verify the connections.
