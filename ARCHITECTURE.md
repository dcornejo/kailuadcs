# DCS Architecture

The core of DCS consists of the logger module. In any configuration,
you must have this running.

Additionally, the ops module is provided as an optional method to launch,
monitor, and restart DCS.

Peripheral to logger are two classes of program, data sources, and APIs.

A data source is the device driver to adapt the reporting device to the DCS.

An API is an alternate method for getting the data out and usable in 
real time. APIs would serve other applications such as a real time
system monitor, or alternate recording system.

At the heart of DCS is a software package called redis that we use for
interprocess communication. See [redis.io](https://redis.io/) for details.

The DCS was originally written in node.js. It is expected that the
core of DCS will remain in node.js, but the only requirement for
any component is that there be a redis driver available in the
language it is written in. Check the [redis clients list](https://redis.io/clients)
for what's available.

## DCS Core (logger.js)

The core consists of a single program, logger.js. This program
is responsible for listening to the DcsLogger queue, logging the
message to a file, and retransmitting the received messages on the
DcsFeed queue. 

DcsLogger is a strict FIFO and a message can be received only by a 
single source. DcsLogger is also persistent in that any messages sent 
are stored until logger reads them. This assures that no messages are 
lost if logger is restarted.

DcsFeed is a publish/subscribe queue. When a message is sent, all
subscribers see the message. Unlike DcsLogger, when a message is 
published, it is only seen by the current subscribers. A process
subscribing after the message will never see it.

Logger consists of the initialization code and a loop to read
incoming messages from DcsLogger. The messages are logged to a 
local log file on command, and retransmitted on DcsFeed.
Additionally, the incoming messages are checked for commands
destined for the logger. These commands perform actions such
as starting and stopping data collection.

## Data Sources

A Data Source is responsible for adapting the incoming reports
from a specific device. The
structure of a data source varies by the need of the monitoring
device. To be a data source the program needs to transmit messages
to the DcsLogger queue. It may optionally listen to the DcsFeed
for commands.

A very basic example of a data source can be found in the tick
data source. This is a very simple source that posts a message
periodically to provide a heart-beat for the DCS.

It is important to keep the latency low on a data source
so the temptation to add features to them should be considered
carefully. Early iterations of DCS suffered from trying to
do everything in a single process and this caused numerous 
timing problems. If you need to add a feature not related
to the job of getting messages to and from a device, strongly
consider writing an API. For example, splitting an item from
a message and transmitting it to another application is best 
done by an API listening to the messages on DcsFeed.

## APIs

APIs provide a means for other applications to access
the data stream of DcsFeed and to relay commands from an
application to the DCS.

These are typically more complex in structure than a data
source, and the recommended example is api-sse.
