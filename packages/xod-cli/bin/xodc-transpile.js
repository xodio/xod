'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _xodEspruino = require('xod-espruino');

var _clui = require('clui');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// transpile|t <xodball>            Transpile code
// -t --target [espruino|arduino]   Transpile code for target device (espruino by default).
// -o --output [filename.txt]       Output result into file (or stdout by default).

/* eslint-disable no-console */

exports.default = function (xodball, program) {
  var target = program.target;
  var output = program.output;
  var filename = _path2.default.basename(xodball);

  console.log('Transpiling ' + filename + ' for ' + target);

  var spinner = new _clui.Spinner('Transpiling code...');

  spinner.start();

  var json = _fs2.default.readFileSync(xodball);
  var project = JSON.parse(json);
  var code = (0, _xodEspruino.transpile)({ project: project, runtime: _xodEspruino.runtime });

  spinner.stop();

  if (output) {
    _fs2.default.writeFileSync(output, code);
    console.log('Result has been wrote into ', output, 'file.');
    process.exit(1);
  }

  process.stdout.write(code);
  process.exit(1);
};