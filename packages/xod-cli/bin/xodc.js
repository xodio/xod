#!/usr/bin/env node
'use strict';

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _xodcPack = require('./xodc-pack');

var _xodcPack2 = _interopRequireDefault(_xodcPack);

var _xodcUnpack = require('./xodc-unpack');

var _xodcUnpack2 = _interopRequireDefault(_xodcUnpack);

var _xodcTranspile = require('./xodc-transpile');

var _xodcTranspile2 = _interopRequireDefault(_xodcTranspile);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-console */

_commander2.default.version('0.0.1');

_commander2.default.command('pack <projectDir> <output>').description('Pack project directory into xodball').alias('p').action(_xodcPack2.default);
_commander2.default.command('unpack <xodball> <workspace>').description('Unpack xodball into new project directory in the workspace').alias('u').action(_xodcUnpack2.default);

_commander2.default.command('transpile <xodball>').description('transpile project').option('-t, --target [target]', 'Target device for transpilation', 'espruino').option('-o, --output [filename]', 'Write result of transpilation into file', false).alias('t').action(_xodcTranspile2.default);

_commander2.default.parse(process.argv);

if (_commander2.default.args.length === 0) {
  console.log(_commander2.default.help());
}