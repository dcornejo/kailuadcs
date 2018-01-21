# Kailua Data Collection System (KailuaDCS)

This code originally was originally proprietary and has been re-released
as open-source. In the process of removing non-public parts, you may find holes
in the code and documentation where things were unceremoniously ripped out.

This code has not been tested since it's import into the repository.

I am working on making sure it is good as quickly as I can, pull requests are
welcome, but please take a look at TODO first.

# Installation

We currently support installation on Ubuntu Linux 16.04 and Mac OS X.
Other Linux versions and FreeBSD may work, but support is not guaranteed.

## Getting the installation files

The recommended method is to clone the [github repo](https://github.com/dcornejo/kailuadcs.git).

## Ubuntu

### Install node.js

We do not use the Ubuntu distributed node.js package. To stay up-to-date
install Nodesource's version. Follow the directions to install
Node.js v6.x from [github](https://github.com/nodesource/distributions).

*Have seen problems installing on Ubuntu 16.04, in which case the following
seems to work:*

```
% sudo -i
% curl -sL https://deb.nodesource.com/setup_6.x | bash -
% apt-get install -y nodejs
```

Confirm that you have the correct version installed by invoking ```'node -v'```.

#### Install Bluetooth libraries for Ubuntu

```
% apt-get install build-essential libbluetooth-dev
```

### Install redis

Unfortunately, redis does not have an up-to-date PPA. 

Chris Lea has [one](https://launchpad.net/~chris-lea/+archive/ubuntu/redis-server), but due to some problems
with Ubuntu dependencies, it is not kept up to date. So, we will need to build it from source.

Start off by following the directions from [Digital Oceans](https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-redis-on-ubuntu-16-04) web site.

One exception to this is that the file /etc/systemd/system/redis.service should actually be

```
[Unit]
Description=Redis In-Memory Data Store
After=rc-local.service

[Service]
User=redis
Group=redis
ExecStart=/usr/local/bin/redis-server /etc/redis/redis.conf
ExecStop=/usr/local/bin/redis-cli shutdown
Restart=always

[Install]
WantedBy=multi-user.target
```
The only change is the third line of the file. When we tune the system for the server we need redis to start *after* 
rc.local has been processed.

At this point you should have a working redis server, but we want to tune the OS for the best operation.

Using an editor open up /etc/sysctl.conf and add the following at the bottom of the file:

```
vm.overcommit_memory = 1
net.core.somaxconn = 511
```

Then in /etc/rc.local add the following line:

```
echo never > /sys/kernel/mm/transparent_hugepage/enabled
```

Once this is done, reboot the system. When it's back up use the redis-cli command to ping the server again as you did
under the testing section of the installation instructions.

The redis server is installed as a system service and will be restarted automatically whenever the system is booted.

## Configure the permissions for serial port for Ubuntu

By default Ubuntu doesn't give a normal user access to the serial ports. You
must give the user permission by adding them to the "dialout" group.

```
% sudo nano /etc/group
```

scroll down to find the line starting with "dialout:" - if the last character is 
a ":" then just add the user name to the line. if there is already a user name 
after the last ":" then add the user name and separate it from the existing 
one(s) with a ","

You must log out and then log back in for the group permissions to take effect.

## Mac OS X

[TBD]

## Common

### Install node modules

Every device/function has its own directory.

You should run
```
% npm install
```

In each of the relevant directories.

### Configure the Ops Server

THIS IS WHERE IT GETS HARD!

All the configuration files have been combined into one. Take a look at ops/config.json-example.

Before you start, copy "config.json-example" to "config.json" and edit there.

There are three sections to the configuration file. There is the core *logger* function,
which is required for anything to run.

The next section is *sources* which are your data sources.

The third section is *apis* which are the utilities which do things like provide a place for
the tablet app to connect to.

Each entry has four elements: description, path, options, and respawn.

description, obviously describes what's this entry does.

path is the location, reative to the ops subdirectory, where the functions script is

options is the important part. This is a list of options for this particular instance.
You can get the list of options for a device/function by involking the script indicated in path with the --help option.

## Running the program

This is much simpler than it used to be!

```
% cd ops
% node ops.js
```

You can get a help message with:

```% node ops.js --help```

## Upgrading

When upgrading (or downgrading) a version, you should always make sure that the dependencies
are installed and up to date.

For the truly paranoid remove all the old modules first:

```% rm -rf node_modules```

Then install all the required dependencies:

```% npm install```

If you ever get a "Cannot find module..." error, start with the above commands and see if that
resolves the problem.


---
