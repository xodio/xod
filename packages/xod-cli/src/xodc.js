#!/usr/bin/env node

import { docopt } from 'docopt';
import sourceMapSupport from 'source-map-support';
import { runCommand } from './utils';

import install from './xodc-install';
import pack from './xodc-pack';
import publish from './xodc-publish';
import transpile from './xodc-transpile';
import unpack from './xodc-unpack';

const PM_SWAGGER_URL = 'https://pm.xod.io/swagger';

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
  xodc transpile [--output=<filename>] <input> <path>
  xodc publish [--swagger=<swagger>] [--orgname=<orgname>] [<projectDir>]
  xodc install --swagger=<swagger> <libUri> [<path>]

Commands:
  pack                  Pack project directory into xodball.
  unpack                Unpack xodball into new project directory.
  transpile             Transpile project into device runtime.
  publish               Publish a new library version.
  install               Install the library into workspace.

Options:
  --output=<filename>   Write result of transpilation into file.
  --clear               Clear output dir before generate documentation.
`;

const programs = {
  pack: o => pack(o['<projectDir>'], o['<output>']),
  unpack: o => unpack(o['<xodball>'], o['<workspace>']),
  transpile: o =>
    transpile(o['<input>'], o['<path>'], {
      output: o['--output'],
    }),
  publish: o =>
    publish(
      o['--swagger'] || PM_SWAGGER_URL,
      o['--orgname'],
      o['<projectDir>'] || '.'
    ),
  install: o =>
    install(
      o['--swagger'] || PM_SWAGGER_URL,
      o['<libUri>'],
      o['<path>'] || '.'
    ),
};

// Running command
runCommand(docopt(doc, { version }), programs);
