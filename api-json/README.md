# Tablet API

This API provides the legacy tablet interface for the DCS

The tablet API will interface to the tablet app via TCP socket as the first generation
API did.

For the interface to the logger task we use two redis data structures.

The path for data from the data sources is through a PUB/SUB structure called LegacyAPI. Commands from the legacy API are sent back to the logger through a list structure called "LoggerControl"
 
Outbound data source data will be received by the Tablet API in the internal JSON format (essentially exactly what is written to the log file). Any legacy device specific manipulations are done in this task rather than burdening the logger with them.

Commands from the legacy device to the logger are maintained from the previous generation of the API, but
they are to be translated to a standardized JSON format.

The data and commands available to the legacy API are frozen, new development should
happen in the next generation API.

TODO: rename this API to the "Legacy API"
