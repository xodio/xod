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

// unpack <xodball> <workspace>   Unpack xodball into new project directory in the workspace
/* eslint-disable no-console */

exports.default = function (xodball, workspace) {
  var xodballPath = _path2.default.resolve(xodball);
  var workspacePath = _path2.default.resolve(workspace);

  console.log('Unpacking ' + xodballPath + ' into ' + workspacePath);

  var spinner = new _clui.Spinner('Packing project...');
  spinner.start();

  try {
    _fs2.default.readFile(xodballPath, 'utf8', function (err, data) {
      if (err) {
        throw err;
      }

      var json = JSON.parse(data);
      var unpacked = (0, _xodFs.arrangeByFiles)(json);
      var projectName = json.meta.name;

      (0, _xodFs.save)(unpacked, workspacePath, function () {
        spinner.stop();
        console.log('Project "' + projectName + '" successfully unpacked!');
      }, function (saveError) {
        throw saveError;
      });
    });
  } catch (err) {
    spinner.stop();
    console.error(err);
    process.exit(0);
  }
};