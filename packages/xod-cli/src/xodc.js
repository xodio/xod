#!/usr/bin/env node

import { docopt } from 'docopt';
import * as ab from './xodc-ab';
import doc from './xodc-doc';
import pack from './xodc-pack';
import transpile from './xodc-transpile';
import unpack from './xodc-unpack';

function match(options, foobar) {
  for (const [command, program] of Object.entries(foobar)) {
    if (options[command] === true) {
      program(options);
      break;
    }
  }
}

match(docopt(`
XOD project: Command Line Interface

Usage:
  xodc pack <projectDir> <output>
  xodc unpack <xodball> <workspace>
  xodc transpile [--output=<filename>] [--target=<target>] <input>
  xodc doc [--clear] <outputDir> <templatesDir> <projectDir>
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
  doc                   Generate doc for project.
  ab set-executable     Set path to Arduino IDE executable.
  ab set-packages       Set path to Arduino IDE packages.
  ab list-inde          List the raw official Arduino package index.
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
`, { version: '0.0.1' }), {
  pack: o => pack(o['<projectDir>'], o['<output>']),
  unpack: o => unpack(o['<xodball>'], o['<workspace>']),
  transpile: o => transpile(o['<input>'], { target: o['--target'], output: o['--output'] }),
  doc: o => doc(o['<outputDir>'], o['<templatesDir>'], o['<projectDir>'], { clear: o['--clear'] }),
  ab: o => match(o, {
    'set-executable': () => ab.setExecutable(o['<path>']),
    'set-packages': () => ab.setPackages(o['<path>']),
    'list-index': () => ab.listIndex(),
    'list-pavs': () => ab.listPavs(),
    'list-ports': () => ab.listPorts(),
    'list-boards': () => ab.listBoards(o['<package>'], o['<architecture>'], o['<version>']),
    'install-pav': () => ab.installPav(o['<package>'], o['<architecture>'], o['<version>']),
    compile: () => ab.compile(o['<package>'], o['<architecture>'], o['<board>'], o['<file>']),
    upload: () => ab.upload(o['<package>'], o['<architecture>'], o['<board>'], o['<port>'], o['<file>']),
  }),
});
