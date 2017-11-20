XOD
===

[![Build Status](https://travis-ci.com/xodio/xod.svg?token=qpYnhqFDqibUozbjyas8&branch=master)](https://travis-ci.com/xodio/xod)
[![Build status](https://ci.appveyor.com/api/projects/status/vk5ngjb4xw4m60ks?svg=true)](https://ci.appveyor.com/project/xod/xod)

XOD is a visual programming language for microcontrollers. For documentation
and downloads visit https://xod.io.

This repository contains sources for XOD language core, XOD IDE, XOD standard
library, and XOD documentation.

Development copy setup
----------------------

We use [Yarn](https://yarnpkg.com/lang/en/) to run routine tasks on source
files.  Make sure it is available on your system.  Clone the repository and set
working directory to its root. Then run

    $ yarn

to install all JS dependencies.

### Browser IDE

    $ yarn dev:browser

Open <http://localhost:8080> in your browser.

### Desktop IDE

    $ yarn build:electron
    $ yarn start:electron

Directory structure
-------------------

The project is managed as a [Lerna](https://github.com/lerna/lerna) monorepo and
split up in few directories:

- `packages/` — most of source code is here; navigate to a particular package
  to see it’s own `README` and get an idea what it is for
- `tools/` — utility scripts to assist build process and routine maintenance
  tasks
- `docs/` — documentation source for https://xod.io/docs/
- `workspace/` — XOD standard library, default projects, and end-to-end
  fixtures

Repository commands
-------------------

You can run several commands on source files. They are available as yarn
subcommands:

- `yarn build` — build, transpile, pack all
- `yarn build:electron` — build desktop IDE only
- `yarn build:cli` — build CLI tools only
- `yarn dev:browser` — run dev-version of browser IDE on localhost
- `yarn dist:electron` — build OS-specific distributive of desktop IDE
- `yarn test` — run unit tests
- `yarn test-cpp` — run C++ code tests
- `yarn test-func` — run functional tests
- `yarn lint` — run the linter to check code style
- `yarn verify` — build, lint, test; run this prior to a pull request
- `yarn ci` — install & verify; CI-server uses this command
- `yarn start:electron` — starts desktop IDE
- `yarn start:spectron-repl` — starts functional tests environment
- `yarn storybook` — starts React components viewer for visual inspection
- `yarn clean` — remove build artifacts and installed `node_modules`

Note that dependencies between tasks are not resolved. `test` and `start:*`
expect that the project is already built.

### Scoping

Many commands (notably `build`, `dev`, `test`) support package scoping to
save development time. To rebuild only `xod-project`:

    $ yarn build --scope xod-project

To rebuild `xod-project` and its dependencies:

    $ yarn build --scope xod-project --include-filtered-dependencies

Those are standard [Lerna flags](https://github.com/lerna/lerna#flags).

### Debugging functional tests

`yarn test-func` runs automated end-to-end functional tests.

You can set `XOD_DEBUG_TESTS` environment variable to keep IDE open on failure:
`XOD_DEBUG_TESTS=1 yarn test-func`

Use `yarn start:spectron-repl` to run an interactive session and control the
IDE window programmatically.

### Running C++ tests

You need `avr-gcc` and [PlatformIO Core](http://platformio.org/get-started/cli)
to be installed system-wide to run C++ code tests. They are available as OS
packages for most platforms.

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

Feel free to contribute to the project! Make sure to read [contribution
guidelines](./CONTRIBUTING.md).

Jetbrains users can benefit from [XOD Jetbrains Live
Template](tools/xod-jetbrains-live-template/xod-jetbrains-live-template.md).
