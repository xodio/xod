XOD
===

[![Build Status](https://travis-ci.com/xodio/xod.svg?token=qpYnhqFDqibUozbjyas8&branch=master)](https://travis-ci.com/xodio/xod)
[![Build status](https://ci.appveyor.com/api/projects/status/vk5ngjb4xw4m60ks?svg=true)](https://ci.appveyor.com/project/xod/xod)

Deployment on localhost
-----------------------

Install all dependencies and perform package cross-linking with:

    $ yarn install

Build the code:

    $ yarn run build

### Browser IDE

    $ yarn run dev -- xod-client-browser

Open <http://localhost:8080> in your browser.

### Desktop IDE

    $ yarn run electron-rebuild
    $ yarn run start:xod-client-electron

Maintenance Scripts
-------------------

### Cleaning

* `yarn run clean:dist` removes all build artifacts
* `yarn run clean:node_modules` removes all installed `node_modules` in all packages
* `yarn run clean` resets the sandbox to just-cloned state

### Verification

* `yarn run lint` performs lint-checking in all packages
* `yarn run test -- <name> --only` runs test on package with specified `<name>`.
  E.g. `yarn run test -- xod-client --only`.
* `yarn run test -- <name>` runs test on package with specified `<name>`,
  and all packages it depends on directly or indirectly.
  E.g. `yarn run test -- xod-client`.
* `yarn test` tests all packages
* `yarn test-func` runs automated end-to-end functional tests.
  You can set `XOD_DEBUG_TESTS` environment variable to keep IDE open on failure:
  `XOD_DEBUG_TESTS=1 yarn test-func`
* `yarn run verify` builds lints and tests; run this prior to pull request
* `yarn run ci` installs and verifies; used as a script for CI-server

Run `yarn start:spectron-repl` to start IDE under control of
[Spectron](https://github.com/electron/spectron). Then you can use objects
provided by REPL to query elements, click buttons, etc. It would help in
creating functional tests for IDE.

### Building

* `yarn run build` builds all packages
* `yarn run build -- <name> --only` builds a package with specified `<name>`,
  e.g. `yarn run build -- xod-cli --only`
* `yarn run build -- <name>` builds a package with specified `<name>`
  and all its dependencies, e.g. `yarn run build -- xod-client-electron`
* `yarn run dev -- <name> --only` builds a package with specified `<name>` and
  stays in watch mode with auto-rebuild when its files change,
  e.g. `yarn run dev -- xod-cli --only`
* `yarn run dev -- <name>` builds a package with specified `<name>` and all
  its dependencies, then stay in watch mode looking for changes in that
  package or any of its dependencies;
  e.g. `yarn run dev -- xod-client-browser`

### Packaging

* `yarn run bootsrap` creates all necessary links between local packages and
  installs their dependencies

### Distributing

* Creates a distribution artifact corresponding to host's platform:
    
    ```bash
    yarn install
    yarn run verify
    yarn run electron-dist
    ```

License
-------

Copyright 2017 XOD LLC.

This program is free software: you can redistribute it and/or  modify it under
the terms of the GNU Affero General Public License, version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE.  See the GNU Affero General Public License for more
details.

You should have received a copy of the GNU Affero General Public License along
with this program. If not, see <http://www.gnu.org/licenses/>.

As a special exception, the copyright holders give permission to link the code
of portions of this program with the OpenSSL library under certain conditions
as described in each individual source file and distribute linked combinations
including the program with the OpenSSL library. You must comply with the GNU
Affero General Public License in all respects for all of the code used other
than as permitted herein. If you modify file(s) with this exception, you may
extend this exception to your version of the file(s), but you are not obligated
to do so. If you do not wish to do so, delete this exception statement from
your version. If you delete this exception statement from all source files in
the program, then also delete it in the license file.

Contributing
------------

Feel free to contribute to the project! Make sure to read [contribution guidelines](./CONTRIBUTING.md).

Jetbrains users can benefit from [XOD Jetbrains Live
Template](tools/xod-jetbrains-live-template/xod-jetbrains-live-template.md).
