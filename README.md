XOD
===

[![Build Status](https://travis-ci.com/amperka/xod.svg?token=qpYnhqFDqibUozbjyas8&branch=master)](https://travis-ci.com/amperka/xod)

Deployment on localhost
-----------------------

    $ make install
    $ make start

Open <http://localhost:8080> in your browser.

XOD-SERVER
----------
You will need a MongoDB to serve data.

    $ make server

Runs a REST API server, that provides authorization, save/load in cloud and etc.
Open API Explorer to learn more: <http://0.0.0.0:3000/explorer/>

    $ npm run addUser %USERNAME% %EMAIL% %PASSWORD%

Creates a user using cli-tools.

    $npm run reset

Removes all data from your database and automatically creates the first user named Amperka.
But be careful, you can't restore your data if you didn't make a backup!
This scripts made only for testing purposes.


Maintenance Scripts
-------------------

    $ make start

Run webpack dev server along with services enough to use XOD in a browser on
localhost.

    $ make server

Run REST API server with hot reloading.

    $ make lint

Check coding standards. It should return zero warnings and errors.

    $ make test

Build development version of xod and test it.

Building User Documentation
---------------------------

Refer to [README](xod-client/doc/README.md) in `xod-client/doc/` directory.
