XOD
===

[![Build Status](https://travis-ci.com/amperka/xod.svg?token=qpYnhqFDqibUozbjyas8&branch=master)](https://travis-ci.com/amperka/xod)

Deployment on localhost
-----------------------

Start MongoDB with default network settings if you want to access the server.

    $ make install
    $ make dev

Open <http://localhost:8080> in your browser to see the IDE.
Open <http://localhost:3000/explorer/> to interact with REST API.

Maintenance Scripts
-------------------

To run dev server along with services enough to use XOD in a browser on
localhost:

    $ make dev

To just build distribution-ready packages:

    $ make build

To check coding standards:

    $ make lint

To run tests:

    $ make test

To do all checks that CI server would do on push:

    $ make ci

Managing Data
-------------

All scripts chould be run from within `xod-server` directory.

    $ cd xod-server

You should have MongoDB up and running.

To create a user in the DB:

    $ npm run addUser %USERNAME% %EMAIL% %PASSWORD%

To destroy all data and reset the DB to an initial state:

    $ npm run reset

Building User Documentation
---------------------------

Refer to [README](xod-client/doc/README.md) in `xod-client/doc/` directory.
