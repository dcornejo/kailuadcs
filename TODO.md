# Ruminations on what's next

Please feel free to add to this document if you have ideas or requests

## Daemonized operation

The DCS scripts should start up when the system is booted and should be monitored and restarted
automatically.

## Full lifecycle logging

The current setup of the sources open up the redis rather late - so early on errors
like missing devices can't be reported except via stdout. Reorganize the files so that
redis is opened early and we can report these errors via the logger. An enhancement to
the logger is to have it watch for error messages and to console log them regardless of
the verbosity setting.

## Split commons things into packages

Evaluate the code to see if we can move common code to a package to ease maintenance and
reduce the template data source or API to a minimum.

Things we might be able to package:
- redis writes to DcsLogger (writeLog())
- read commands from DcsFeed

