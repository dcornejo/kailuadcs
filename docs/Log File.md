# DCS Log File Format

## Common Format

The format for all lines is

<*timestamp*>,<*device*>,<*deviceId*>,<*message type*>, *message data*

| field | description |
| :--- | :--- |
| timestamp | the time that the message was logged, milliseconds since midnight 1/1/1970 UTC |
| device | a short string indicating the device type |
| deviceId | a unique identifier for each device |
| type | string denoting the type of this entry |

The rest of this document is arranged by *device* and *type*. In message descriptions
below, the timestamp, device, and device Id are omitted.

## APP

## OBD

### vss - Vehicle Speed

Indicates the vehicle speed in kilometers per hour.

### rpm - Engine RPM

Indicates the engine revolutions per minute.

### load_pct - Throttle Load Percentage

The throttle load in percent.

