#!/usr/bin/env node

import { docopt } from 'docopt';
import sourceMapSupport from 'source-map-support';
import { runCommand } from './utils';

import * as ab from './xodc-ab';
import install from './xodc-install';
import pack from './xodc-pack';
import publish from './xodc-publish';
import transpile from './xodc-transpile';
import unpack from './xodc-unpack';

const PM_SWAGGER_URL = 'https://pm.xod.show/swagger';

// In case of unhandled errors this would give more adequate debug traces:
// 1. More than default 10 items
Error.stackTraceLimit = 200;
// 2. Source map to original sources
sourceMapSupport.install();

// Config
const version = '0.0.1';
const doc = `
XOD project: Command Line Interface

Usage:
  xodc pack <projectDir> <output>
  xodc unpack <xodball> <workspace>
  xodc transpile [--output=<filename>] [--target=<target>] <input> <path>
  xodc publish [--swagger=<swagger>] [--orgname=<orgname>] [<projectDir>]
  xodc install --swagger=<swagger> <libUri> [<path>]
  xodc ab set-executable <path>
  xodc ab set-packages <path>
  xodc ab list-index
  xodc ab list-pavs
  xodc ab list-ports
  xodc ab list-boards <package> <architecture> <version>
  xodc ab install-pav <package> <architecture> <version>
  xodc ab compile <package> <architecture> <board> <file>
  xodc ab upload <package> <architecture> <board> <port> <file>

Commands:
  pack                  Pack project directory into xodball.
  unpack                Unpack xodball into new project directory.
  transpile             Transpile project into device runtime.
  publish               Publish a new library version.
  install               Install the library into workspace.
  ab set-executable     Set path to Arduino IDE executable.
  ab set-packages       Set path to Arduino IDE packages.
  ab list-index         List the raw official Arduino package index.
  ab list-pav           List the processed official Arduino package index.
  ab list-port          List the available ports.
  ab list-boards        List the boards supported by the PAV.
  ab install-pav        Install the PAV.
  ab compile            Compile the file for the PAB.
  ab upload             Upload the file for the PAB to port.

Options:
  --target=<target>     Target device for transpilation [default: espruino].
  --output=<filename>   Write result of transpilation into file.
  --clear               Clear output dir before generate documentation.
`;

const programs = {
  pack: o => pack(o['<projectDir>'], o['<output>']),
  unpack: o => unpack(o['<xodball>'], o['<workspace>']),
  transpile: o => transpile(o['<input>'], o['<path>'], {
    output: o['--output'],
    target: o['--target'],
  }),
  publish: o => publish(
    o['--swagger'] || PM_SWAGGER_URL,
    o['--orgname'],
    o['<projectDir>'] || '.'),
  install: o => install(
    o['--swagger'] || PM_SWAGGER_URL,
    o['<libUri>'],
    o['<path>'] || '.'),
  ab: o => runCommand(o, {
    'set-executable': () => ab.setExecutable(o['<path>']),
    'set-packages': () => ab.setPackages(o['<path>']),
    'list-index': () => ab.listIndex(),
    'list-pavs': () => ab.listPavs(),
    'list-ports': () => ab.listPorts(),
    'list-boards': () => ab.listBoards(
      o['<package>'], o['<architecture>'], o['<version>']
    ),
    'install-pav': () => ab.installPav(
      o['<package>'], o['<architecture>'], o['<version>']
    ),
    compile: () => ab.compile(
      o['<package>'], o['<architecture>'], o['<board>'], o['<file>']
    ),
    upload: () => ab.upload(
      o['<package>'], o['<architecture>'], o['<board>'], o['<port>'],
      o['<file>']
    ),
  }),
};

// Running command
runCommand(docopt(doc, { version }), programs);
