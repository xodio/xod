/** @see {@link https://github.com/arduino/Arduino/blob/master/build/shared/manpage.adoc} */

/** Ramda path
 * @typedef {string[]} RamdaPath
 * @see {@link http://ramdajs.com/docs/#assocPath} */

/** File system path.
 * @typedef {string} Path */

/** Universal Resource Identifier.
 * @typedef {string} URL
 * @see {@link https://url.spec.whatwg.org/} */

/** Arduino definition file.
 * @typedef {string} ArduinoDefinitionFile
 * @example
 # See: http://code.google.com/p/arduino/wiki/Platforms
 menu.cpu=Processor
 ##############################################################
 yun.name=Arduino Yún
 yun.upload.via_ssh=true
 yun.vid.0=0x2341
 yun.pid.0=0x0041
 yun.vid.1=0x2341
 yun.pid.1=0x8041
 * */

/** Package, architecture, version.
 * @typedef {Object} PAV
 * @property {string} architecture
 * @property {string} package
 * @property {string} version */

/** Package, architecture, board.
 * @typedef {Object} PAB
 * @property {string} architecture
 * @property {string} board
 * @property {string} package */

/** Serial port object.
 * @typedef {Object} Port
 * @property {string} comName - The {@link Path} or identifier used to open the serial port.
 * @see {@link https://www.npmjs.com/package/serialport#listing-ports} */

import path from 'path';
import R from 'ramda';
import rest from 'rest';
import errorCode from 'rest/interceptor/errorCode';
import mime from 'rest/interceptor/mime';
import SerialPort from 'serialport';
import { exec } from 'child-process-promise';
import { writeJSON, readFile, readJSON } from 'xod-fs';

import { REST_ERROR } from './errors';

export * from './errors';

const unifyExec = fn => exec(fn)
  .then(r => ({ code: r.childProcess.exitCode, stdout: r.stdout, stderr: r.stderr }))
  .catch(r => ({ code: r.code, stdout: r.stdout, stderr: r.stderr }));

/** A url of the [official Arduino package index]{@link http://downloads.arduino.cc/packages/package_index.json}.
 * @constant
 * @type URL */
const ARDUINO_PACKAGE_INDEX_URL = 'http://downloads.arduino.cc/packages/package_index.json';

/** Ramda path to Arduino IDE executable {@link Path} in the {@link CONFIG_PATH} file.
 * @constant
 * @type RamdaPath */
const ARDUINO_IDE_PATH_EXECUTABLE = ['arduino_ide', 'path', 'executable'];

/** Ramda path to Arduino IDE packages {@link Path} in the {@link CONFIG_PATH} file.
 * @constant
 * @type RamdaPath */
const ARDUINO_IDE_PATH_PACKAGES = ['arduino_ide', 'path', 'packages'];

/** A path to builder's configuration file.
 * @constant
 * @type Path */
const CONFIG_PATH = path.resolve(path.dirname(module.filename), 'config.json');

/** Writes the provided configuration to {@link CONFIG_PATH} file.
 * @param {*} config
 * @return {Promise<Object, Error>} */
const setConfig = config =>
  Promise.resolve()
    .then(() => writeJSON(CONFIG_PATH, config));

/** Reads the configuration value from file at {@link CONFIG_PATH}.
 * @param {RamdaPath} [ramdaPath=[]] - Ramda path to configuration value.
 * @return {Promise<*, Error>} */
const getConfig = (ramdaPath = []) =>
  Promise.resolve()
    .then(() => readJSON(CONFIG_PATH))
    .then(R.path(ramdaPath));

/** Parses Arduino's `.txt` definition file.
 * @kind function
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

/** Sets path to Arduino IDE executable.
 * @param {Path} arduinoIdePathExecutable - Path to Arduino IDE executable.
 * @return {Promise<Object, Error>} */
export const setArduinoIdePathExecutable = arduinoIdePathExecutable =>
  getConfig()
    .catch(() => Promise.resolve({}))
    .then(R.assocPath(ARDUINO_IDE_PATH_EXECUTABLE)(arduinoIdePathExecutable))
    .then(setConfig);

/** Sets path to Arduino IDE packages.
 * @param {Path} arduinoIdePathPackages - Path to Arduino IDE packages.
 * @return {Promise<Object, Error>} */
export const setArduinoIdePathPackages = arduinoIdePathPackages =>
  getConfig()
    .catch(() => Promise.resolve({}))
    .then(R.assocPath(ARDUINO_IDE_PATH_PACKAGES)(arduinoIdePathPackages))
    .then(setConfig);

/** Lists the raw [official Arduino package index]{@link http://downloads.arduino.cc/packages/package_index.json}.
 * @return {Promise<Object, Symbol<REST_ERROR>>} */
export const listPackageIndex = () =>
  rest.wrap(mime).wrap(errorCode)({ path: ARDUINO_PACKAGE_INDEX_URL })
    .then(R.prop('entity'))
    .catch(() => Promise.reject(REST_ERROR));

/** Lists the processed [official Arduino package index]{@link http://downloads.arduino.cc/packages/package_index.json}, optimized for {@link PAV} selection.
    CmdResult.data contains
 * @return {Promise<Map<string, PAV[]>, Error>} */
export const listPAVs = () =>
  listPackageIndex()
    .then(R.compose(
      R.groupBy(pav => `${pav.package}:${pav.architecture}`),
      R.unnest,
      R.map(({ name, platforms }) =>
        platforms.map(({ architecture, version }) => ({
          package: name,
          architecture,
          version,
        }))
      ),
      R.prop('packages')
    ));

/** Installs the selected {@link PAV}.
 * @param {PAV} pav - Selected {@link PAV}.
 * @return {Promise<String, Error>} */
export const installPAV = pav =>
  getConfig(ARDUINO_IDE_PATH_EXECUTABLE)
    .then(arduino => unifyExec(`${arduino} --install-boards ${pav.package}:${pav.architecture}:${pav.version}`))
    .then(({ code, stdout, stderr }) =>
      R.cond([
        [R.equals(255), R.always(stdout)],
        [R.equals(0), R.always(stdout)],
        [R.T, () => Promise.reject(new Error(stderr))],
      ])(code)
    );

/** Lists the boards supported by the selected {@link PAV}.
 * @param {PAV} pav - Selected {@link PAV}.
 * @return {Promise<Object, Error>} */
export const listPAVBoards = pav =>
  getConfig(ARDUINO_IDE_PATH_PACKAGES)
    .then(packages => readFile(path.resolve(packages, pav.package, 'hardware', pav.architecture, pav.version, 'boards.txt')).toString())
    .then(parseTxtConfig);

/** Lists the available {@link Port}s.
 * @return {Promise<Port[], Error>} */
export const listPorts = () =>
  new Promise((resolve, reject) => {
    SerialPort.list((err, ports) => {
      if (err) reject(err);
      else resolve(ports);
    });
  });

/** Compiles the file for the selected {@link PAB}.
 * @param {PAB} pab - Package, architecture, board.
 * @param {Path} file - Path to the compilation source.
 * @return {Promise<String, Error>} */
export const verify = (pab, file) =>
  getConfig(ARDUINO_IDE_PATH_EXECUTABLE)
    .then(arduino => unifyExec(`${arduino} --verify --board "${pab.package}:${pab.architecture}:${pab.board}" "${file}"`))
    .then(
      ({ code, stdout, stderr }) => {
        if (code === 0) { return stdout; }
        return Promise.reject(new Error(stderr));
      }
    );

/** Compiles and uploads the file for the selected {@link PAB} at the specified {@link Port}.
 * @param {PAB} pab - Package, architecture, board.
 * @param {Port#comName} port - Port.
 * @param {Path} file - Path to the compilation source.
 * @return {Promise<String, Error>} */
export const upload = (pab, port, file) =>
  getConfig(ARDUINO_IDE_PATH_EXECUTABLE)
    .then(arduino => unifyExec(`${arduino} --upload --board "${pab.package}:${pab.architecture}:${pab.board}" --port "${port}" "${file}"`))
    .then(
      ({ code, stdout, stderr }) => {
        if (code === 0) { return stdout; }
        return Promise.reject(new Error(stderr));
      }
    );
