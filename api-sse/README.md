# Server Sent Events (SSE) API

## Requests

### feed
http://&lt;server&gt;/feed

This command opens a connection to the redis DcsFeed and transmits the messages
to the requesting device using SSE.

### start
http://&lt;server&gt;/command/start[?filename=<filename>]

This command will start a new log file. If filename is specified, then
this is used as the new file name. If it is not specified then a default
file name is used. The default file name will contain a timestamp. If 
this command is issued while a log file is currently in use, then that
file is closed and the new name opened.

### stop
http://&lt;server&gt;/command/stop

This command closes a log file and terminates logging.

### gps
http://&lt;server&gt;/command/gps?time=&lt;gpstime&gt;&lat=&lt;latitude&gt;&lon=&lt;longitude&gt;

Use this command to report the current GPS information to the system. (This should have it's own data source,
but is here because the source of GPS data is the same as the device implementing
the user interface)

## Emitted Messages

These are the messsages that will be sent to DcsLogger.

### online
The SSE API is online.

### startlog
A new log file has been started.

### stoplog
The current log file is closed and no further log file will be written until
a start command is received.

### gps
The data reported by the GPS receiver of the UI application device.

