XOD
===

[![Build Status](https://travis-ci.com/xodio/xod.svg?token=qpYnhqFDqibUozbjyas8&branch=master)](https://travis-ci.com/xodio/xod)

Deployment on localhost
-----------------------

Install all dependencies and perform package cross-linking with:

    $ npm install
    $ npm run build

### Browser IDE

    $ npm run dev -- xod-client-browser

Open <http://localhost:8080> in your browser.

### Desktop IDE

    $ npm run build -- xod-client-electron
    $ npm run start:xod-client-electron

### Hub Server

Start MongoDB with default network settings. Then:

    $ npm run start:xod-server

Open <http://localhost:3000/explorer/> to interact with REST API.

Maintenance Scripts
-------------------

### Cleaning

* `npm run clean:dist` removes all build artifacts
* `npm run clean:node_modules` removes all installed `node_modules` in all packages
* `npm run clean` resets the sandbox to just-cloned state

### Verification

* `npm run lint` performs lint-checking in all packages
* `npm run test -- <name> --only` runs test on package with specified `<name>`.
  E.g. `npm run test -- xod-client --only`.
* `npm run test -- <name>` runs test on package with specified `<name>`,
  and all packages it depends on directly or indirectly.
  E.g. `npm run test -- xod-client`.
* `npm test` tests all packages
* `npm run verify` builds lints and tests; run this prior to pull request
* `npm run ci` installs and verifies; used as a script for CI-server

### Building

* `npm run build` builds all packages
* `npm run build -- <name> --only` builds a package with specified `<name>`,
  e.g. `npm run build -- xod-core --only`
* `npm run build -- <name>` builds a package with specified `<name>`
  and all its dependencies, e.g. `npm run build -- xod-client-electron`
* `npm run dev -- <name> --only` builds a package with specified `<name>` and
  stays in watch mode with auto-rebuild when its files change,
  e.g. `npm run dev -- xod-core --only`
* `npm run dev -- <name>` builds a package with specified `<name>` and all
  its dependencies, then stay in watch mode looking for changes in that
  package or any of its dependencies;
  e.g. `npm run dev -- xod-client-browser`

### Packaging

* `npm run bootsrap` creates all necessary links between local packages and
  installs their dependencies

Managing Data
-------------

All scripts chould be run from within `xod-server` directory.

    $ cd xod-server

You should have MongoDB up and running.

To create a user in the DB:

    $ npm run addUser <username> <email> <password>

To destroy all data and reset the DB to an initial state:

    $ npm run reset

Contributing
------------

Feel free to contribute to the project! The guidelines can be found [here](./CONTRIBUTING.md).

Jetbrains users can benefit from this [XOD Jetbrains Live Template](tools/xod-jetbrains-live-template/xod-jetbrains-live-template.md).
