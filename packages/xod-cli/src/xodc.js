#!/usr/bin/env node

import { docopt } from 'docopt';
import { runCommand } from './utils';

import * as ab from './xodc-ab';
import generateDoc from './xodc-doc';
import install from './xodc-install';
import pack from './xodc-pack';
import publish from './xodc-publish';
import transpile from './xodc-transpile';
import unpack from './xodc-unpack';

// Config
const version = '0.0.1';
const doc = `
XOD project: Command Line Interface

Usage:
  xodc pack <projectDir> <output>
  xodc unpack <xodball> <workspace>
  xodc migrate <input> <output>
  xodc transpile [--output=<filename>] [--target=<target>] <input> <path>
  xodc doc [--clear] <outputDir> <templatesDir> <projectDir>
  xodc publish --author=<author> [--owner=<owner>] [<projectDir>]
  xodc install <library> [<path>]
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
  migrate               Migrate project into new version.
  transpile             Transpile project into device runtime.
  doc                   Generate doc for project.
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
  doc: o => generateDoc(
    o['<outputDir>'], o['<templatesDir>'], o['<projectDir>'],
    { clear: o['--clear'] }
  ),
  publish: o => publish(
    o['--author'], o['--owner'] || o['--author'], o['<projectDir>'] || '.'
  ),
  install: o => install(o['<library>'], o['<path>'] || '.'),
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
