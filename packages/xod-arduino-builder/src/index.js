/** @see {@link https://github.com/arduino/Arduino/blob/master/build/shared/manpage.adoc} */

import path from 'path';
import R from 'ramda';
import rest from 'rest';
import errorCode from 'rest/interceptor/errorCode';
import mime from 'rest/interceptor/mime';
import { writeJSON, readFile, readJSON } from 'xod-fs';
import { rejectWithCode } from 'xod-func-tools';

import {
  unifyExec,
  processExecResult,
  locateConfigPath,
} from './utils';
import {
  ARDUINO_PACKAGE_INDEX_URL,
  DEFAULT_CONFIG,
} from './constants';
import { REST_ERROR } from './errors';
import * as Lenses from './lenses';

export * from './errors';
export * from './utils';

// =============================================================================
//
// Getters / setters
//
// =============================================================================

/** Sets path to Arduino IDE executable.
 * @type {Function}
 * @param {Path} path Path to Arduino IDE executable.
 * @param {Config} config {@link Config} to update
 * @return {Config} */
export const setArduinoIdePathExecutable = R.set(Lenses.ide);

/** Sets path to Arduino IDE packages.
 * @type {Function}
 * @param {Path} path Path to Arduino packages folder.
 * @param {Config} config {@link Config} to update
 * @return {Config} */
export const setArduinoIdePathPackages = R.set(Lenses.packages);

/** Gets path to Arduino IDE executable.
 * @type {Function}
 * @param {Config} config {@link Config}
 * @return {Path} */
export const getArduinoIdePathExecutable = R.view(Lenses.ide);

/** Gets path to Arduino IDE packages.
 * @type {Function}
 * @param {Config} config {@link Config}
 * @return {Path} */
export const getArduinoIdePathPackages = R.view(Lenses.packages);

/** Parses Arduino's `.txt` definition file.
 * @type {Function}
 * @param {ArduinoDefinitionFile} txt - Arduino definition file content.
 * @return {Object} */
export const parseTxtConfig = R.compose(
  R.reduce((txtConfig, [tokens, value]) => R.assocPath(tokens, value, txtConfig), {}),
  R.map(R.compose(
    R.zipWith(R.call, [R.split('.'), R.identity]),
    R.split('=')
  )),
  R.reject(R.test(/^(#|$)/)),
  R.map(R.trim),
  R.split(/$/mg)
);

// =============================================================================
//
// Impure functions:
// - save / load config
// - list of serial ports
// - list of arduino packages
//
// =============================================================================

/** Writes the provided configuration to config file.
 * @type {Function}
 * @param {*} config
 * @return {Promise<WriteResult, Error>} */
export const saveConfig = writeJSON(locateConfigPath());

/** Reads the configuration value from file at config.
 * @type {Function}
 * @return {Promise.Resolved<Config>} */
export const loadConfig = () => readJSON(locateConfigPath()).catch(() => DEFAULT_CONFIG);

/** Lists the raw [official Arduino package index]{@link http://downloads.arduino.cc/packages/package_index.json}.
 * @type {Function}
 * @return {Promise<Object, Symbol<REST_ERROR>>} */
export const loadPackageIndex = () =>
  rest.wrap(mime).wrap(errorCode)({ path: ARDUINO_PACKAGE_INDEX_URL })
    .then(R.prop('entity'))
    .catch(rejectWithCode(REST_ERROR));

/** Installs the selected {@link PAV}.
 * @type {Function}
 * @param {PAV} pav Selected {@link PAV}.
 * @param {String} idePath Path to Arduino IDE executables
 * @return {Promise<String, Error>} */
export const installPAV = R.curry(R.pipeP(
  (pav, idePath) => unifyExec(`"${idePath}" --install-boards ${pav.package}:${pav.architecture}:${pav.version}`),
  ({ code, stdout, stderr }) => R.cond([
    [R.equals(255), R.always(stdout)],
    [R.equals(0), R.always(stdout)],
    [R.T, () => Promise.reject(new Error(stderr))],
  ])(code)
));

/** Lists the boards supported by the selected {@link PAV}.
 * @type {Function}
 * @param {PAV} pav Selected {@link PAV}.
 * @param {String} packagesPath Path to Arduino packages folder
 * @return {Promise<Object, Error>} */
export const loadPAVBoards = R.curry(
  (pav, packagesPath) => R.pipeP(
    () => Promise.resolve(path.resolve(
      packagesPath,
      pav.package,
      'hardware',
      pav.architecture,
      pav.version,
      'boards.txt'
    )),
    readFile,
    parseTxtConfig
  )()
);

/** Lists the available {@link Port}s.
 * @type {Function}
 * @return {Promise<Port[], Error>} */
export const listPorts = () =>
  new Promise((resolve, reject) => {
    // serialport is a native module that can conflict in ABI versions
    // with one built for Electron:
    //
    //   Error: The module '.../node_modules/serialport/build/Release/serialport.node'
    //   was compiled against a different Node.js version using
    //   NODE_MODULE_VERSION 53. This version of Node.js requires
    //   NODE_MODULE_VERSION 51. Please try re-compiling or re-installing
    //
    // Localize it’s require so that the conflict never arise if we’re
    // using CLI for things not related to serial port.
    //
    // eslint-disable-next-line global-require
    const SerialPort = require('serialport');

    SerialPort.list((err, ports) => {
      if (err) reject(err);
      else resolve(ports);
    });
  });

/** Compiles the file for the selected {@link PAB}.
 * @type {Function}
 * @param {PAB} pab Package, architecture, board
 * @param {Path} file Path to the compilation source
 * @param {Path} idePath Path to Arduino IDE executables
 * @return {Promise<String, Error>} */
export const verify = R.curry(R.pipeP(
  (pab, file, idePath) => unifyExec(
    `"${idePath}" --verify --board "${pab.package}:${pab.architecture}:${pab.board}" "${file}"`
  ),
  processExecResult
));

/** Compiles and uploads the file for the selected {@link PAB} at the specified {@link Port}.
 * @type {Function}
 * @param {PAB} pab - Package, architecture, board.
 * @param {Port#comName} port - Port.
 * @param {Path} file - Path to the compilation source.
 * @param {Path} idePath Path to Arduino IDE executables
 * @return {Promise<String, Error>} */
export const upload = R.curry(R.pipeP(
  (pab, port, file, idePath) => unifyExec(
    `"${idePath}" --upload --board "${pab.package}:${pab.architecture}:${pab.board}" --port "${port}" "${file}"`
  ),
  processExecResult
));
