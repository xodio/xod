/** @see {@link https://github.com/arduino/Arduino/blob/master/build/shared/manpage.adoc} */

import path from 'path';
import R from 'ramda';
import rest from 'rest';
import errorCode from 'rest/interceptor/errorCode';
import mime from 'rest/interceptor/mime';
import SerialPort from 'serialport';
import { exec } from 'child-process-promise';
import { writeJSON, readFile, readJSON } from 'xod-fs';
import { rejectWithCode } from 'xod-func-tools';

import {
  ARDUINO_PACKAGE_INDEX_URL,
  DEFAULT_CONFIG,
  CONFIG_PATH,
} from './constants';
import { REST_ERROR } from './errors';
import * as Lenses from './lenses';

export * from './errors';

// =============================================================================
//
// Utils
//
// =============================================================================

/**
 * Function that executes shell command and unifies result.
 * @type {Function}
 * @param {String} cmd Command to execute in shell
 * @returns {Promise.Resolved<ExecResult>} Promise resolved with unified {@link ExecResult}
 */
const unifyExec = cmd => exec(cmd)
  .then(r => ({ code: r.childProcess.exitCode, stdout: r.stdout, stderr: r.stderr }))
  .catch(r => ({ code: r.code, stdout: r.stdout, stderr: r.stderr }));

/**
 * Function that resolvs/rejects Promise depending on code number
 * @type {Function}
 * @param {ExecResult} execResult {@link ExecResult}
 * @returns {Promise<String, String>} Promise resolved with `stdout` or rejected with `stderr`
 */
const processExecResult = (execResult) => {
  const { code, stdout, stderr } = execResult;
  if (code === 0) { return Promise.resolve(stdout); }
  return Promise.reject(new Error(stderr));
};

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
const parseTxtConfig = R.compose(
  R.reduce((txtConfig, [tokens, value]) => R.assocPath(tokens, value, txtConfig), {}),
  R.map(R.compose(
    R.zipWith(R.call, [R.split('.'), R.identity]),
    R.split('=')
  )),
  R.reject(R.test(/^(#|$)/)),
  R.map(R.trim),
  R.split(/$/mg)
);

/** Lists the processed [official Arduino package index]{@link http://downloads.arduino.cc/packages/package_index.json}, optimized for {@link PAV} selection.
 * @type {Function}
 * @param {Object} packageIndex
 * @return {Map<string, PAV[]} */
export const listPAVs = R.compose(
  R.groupBy(pav => `${pav.package}:${pav.architecture}`),
  R.chain(({ name, platforms }) =>
    platforms.map(({ architecture, version }) => ({
      package: name,
      architecture,
      version,
    }))
  ),
  R.prop('packages')
);

// =============================================================================
//
// Unpure functions:
// - save / load config
// - list of serial ports
// - list of arduino packages
//
// =============================================================================

/** Writes the provided configuration to {@link CONFIG_PATH} file.
 * @type {Function}
 * @param {*} config
 * @return {Promise<WriteResult, Error>} */
export const saveConfig = writeJSON(CONFIG_PATH);

/** Reads the configuration value from file at {@link CONFIG_PATH}.
 * @type {Function}
 * @return {Promise.Resolved<Config>} */
export const loadConfig = () => readJSON(CONFIG_PATH).catch(() => DEFAULT_CONFIG);

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
  (pav, idePath) => unifyExec(`${idePath} --install-boards ${pav.package}:${pav.architecture}:${pav.version}`),
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
export const loadPAVBoards = R.curry(R.pipeP(
  (pav, packagesPath) => path.resolve(
    packagesPath,
    pav.package,
    'hardware',
    pav.architecture,
    pav.version,
    'boards.txt'
  ),
  readFile,
  parseTxtConfig
));

/** Lists the available {@link Port}s.
 * @type {Function}
 * @return {Promise<Port[], Error>} */
export const listPorts = () =>
  new Promise((resolve, reject) => {
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
    `${idePath} --verify --board "${pab.package}:${pab.architecture}:${pab.board}" "${file}"`
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
    `${idePath} --upload --board "${pab.package}:${pab.architecture}:${pab.board}" --port "${port}" "${file}"`
  ),
  processExecResult
));
