# redis channels

key: DcsLogger
type: list

Data sources write, Logger reads
Contains the data from the source

key: LoggerControl
type: list

APIs write, Logger reads
Passes commands from API users to Logger

key: ApiFeed
type: pub/sub

Logger writes, APIs read
Sends data from source to API users

