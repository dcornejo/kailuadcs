#!/bin/bash

# simple script to install all the device/functions - it must be run from the
# top level directory of your installation (the directory above ops, logger, etc.)

# run this command in the installation directory
# TODO: more error checking

# any version of this system must have the logger in it, so check to make
# sure that this directory exists, assume if not, that we're not in root dir

if [ ! -d logger ]; then
    echo "you must be in the top level directory of your installation to run this script"
    exit
fi

# install all the dependencies
APPS="bt-obd2 logger ops serial-obd2 tick api-sse"

for APP in $APPS
do
    echo ${APP};
    ( cd ${APP}; rm -rf node_modules ; npm install );
done

# make sure that the permissions are correct on the JS files
chmod 755 */*.js

