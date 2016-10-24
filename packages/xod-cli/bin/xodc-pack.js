'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _xodFs = require('xod-fs');

var _clui = require('clui');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// pack <projectDir> <output>   Pack project directory into xodball
/* eslint-disable no-console */

exports.default = function (projectDir, output) {
  var projectPath = _path2.default.resolve(projectDir);
  var workspace = _path2.default.resolve(projectDir, '..');
  var dirName = projectDir.split('/').pop();

  console.log('Packing ' + dirName + ' into ' + output);

  var spinner = new _clui.Spinner('Packing project...');

  spinner.start();

  (0, _xodFs.loadProjectWithLibs)(projectPath, workspace).then(function (_ref) {
    var project = _ref.project;
    var libs = _ref.libs;
    return (0, _xodFs.pack)(project, libs);
  }).then(function (packed) {
    return _fs2.default.writeFile(output, JSON.stringify(packed, undefined, 2), 'utf8', function (err) {
      if (err) {
        throw err;
      }

      spinner.stop();
      console.log('Packed project successfully written into ' + output + '.');
    });
  }).catch(function (err) {
    spinner.stop();
    console.error(err);
    process.exit(0);
  });
};