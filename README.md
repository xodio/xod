XOD
===

[![Build Status](https://travis-ci.com/amperka/xod.svg?token=qpYnhqFDqibUozbjyas8&branch=master)](https://travis-ci.com/amperka/xod)

Deployment on localhost
-----------------------

    $ make install
    $ make start

Open <http://localhost:8080> in your browser.

Maintenance Scripts
-------------------

    $ make start

Run webpack dev server along with services enough to use XOD in a browser on
localhost.

    $ make lint

Check coding standards. It should return zero warnings and errors.

    $ make test

Build development version of xod and test it.

Building User Documentation
---------------------------

Refer to [README](xod-client/doc/README.md) in `xod-client/doc/` directory.
