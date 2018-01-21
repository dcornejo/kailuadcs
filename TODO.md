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

## rearrange directories to group by function (core, data sources, apps, and utilities)

## move non-core function to plug-ins and load them dynamically depending upon the configuration


