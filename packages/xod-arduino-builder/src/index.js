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

import fs from 'fs';
import path from 'path';
import R from 'ramda';
import rest from 'rest';
import errorCode from 'rest/interceptor/errorCode';
import mime from 'rest/interceptor/mime';
import SerialPort from 'serialport';
import shelljs from 'shelljs';

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
 * @return {Promise<void>} */
const setConfig = config =>
  Promise.resolve()
    .then(() => fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2)))
    .catch(() => Promise.reject([module.id, 'could not set config']));

/** Reads the configuration value from file at {@link CONFIG_PATH}.
 * @param {RamdaPath} [ramdaPath=[]] - Ramda path to configuration value.
 * @return {Promise<*>} */
const getConfig = (ramdaPath = []) =>
  Promise.resolve()
    .then(() => JSON.parse(fs.readFileSync(CONFIG_PATH).toString()))
    .then(R.path(ramdaPath))
    .catch(() => Promise.reject([module.id, 'could not get config']));

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
 * @return {Promise<void>} */
export const setArduinoIdePathExecutable = arduinoIdePathExecutable =>
  getConfig()
    .catch(() => Promise.resolve({}))
    .then(R.assocPath(ARDUINO_IDE_PATH_EXECUTABLE)(arduinoIdePathExecutable))
    .then(setConfig);

/** Sets path to Arduino IDE packages.
 * @param {Path} arduinoIdePathPackages - Path to Arduino IDE packages.
 * @return {Promise<void>} */
export const setArduinoIdePathPackages = arduinoIdePathPackages =>
  getConfig()
    .catch(() => Promise.resolve({}))
    .then(R.assocPath(ARDUINO_IDE_PATH_PACKAGES)(arduinoIdePathPackages))
    .then(setConfig);

/** Lists the raw [official Arduino package index]{@link http://downloads.arduino.cc/packages/package_index.json}.
 * @return {Promise<Object>} */
export const listPackageIndex = () =>
  rest.wrap(mime).wrap(errorCode)({ path: ARDUINO_PACKAGE_INDEX_URL })
    .then(R.prop('entity'));

/** Lists the processed [official Arduino package index]{@link http://downloads.arduino.cc/packages/package_index.json}, optimized for {@link PAV} selection.
 * @return {Promise<Map<string, PAV[]>>} */
export const listPAVs = () =>
  listPackageIndex().then(R.compose(
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
 * @return {Promise<boolean>} */
export const installPAV = pav =>
  getConfig(ARDUINO_IDE_PATH_EXECUTABLE)
    .then(arduino => shelljs.exec(`${arduino} --install-boards "${pav.package}:${pav.architecture}:${pav.version}"`))
    .then(({ code }) => code === 0 || Promise.reject([module.id, 'could not install boards']));

/** Lists the boards supported by the selected {@link PAV}.
 * @param {PAV} pav - Selected {@link PAV}.
 * @return {Promise<Object>} */
export const listPAVBoards = pav =>
  getConfig(ARDUINO_IDE_PATH_PACKAGES)
    .then(packages => fs.readFileSync(path.resolve(packages, pav.package, 'hardware', pav.architecture, pav.version, 'boards.txt')).toString())
    .then(parseTxtConfig)
    .catch(() => Promise.reject([module.id, 'could not parse boards config']));

/** Lists the available {@link Port}s.
 * @return {Promise<Port[]>} */
export const listPorts = () =>
  new Promise((resolve, reject) => {
    SerialPort.list((error, ports) => {
      if (error) reject(error);
      else resolve(ports);
    });
  });

/** Compiles the file for the selected {@link PAB}.
 * @param {PAB} pab - Package, architecture, board.
 * @param {Path} file - Path to the compilation source.
 * @return {Promise<boolean>} */
export const verify = (pab, file) =>
  getConfig(ARDUINO_IDE_PATH_EXECUTABLE)
    .then(arduino => shelljs.exec(`${arduino} --verify --board "${pab.package}:${pab.architecture}:${pab.board}" "${file}"`))
    .then(({ code }) => code === 0 || Promise.reject([module.id, 'could not build']));

/** Compiles and uploads the file for the selected {@link PAB} at the specified {@link Port}.
 * @param {PAB} pab - Package, architecture, board.
 * @param {Port#comName} port - Port.
 * @param {Path} file - Path to the compilation source.
 * @return {Promise<boolean>} */
export const upload = (pab, port, file) =>
  getConfig(ARDUINO_IDE_PATH_EXECUTABLE)
    .then(arduino => shelljs.exec(`${arduino} --upload --board "${pab.package}:${pab.architecture}:${pab.board}" --port "${port}" "${file}"`))
    .then(({ code }) => code === 0 || Promise.reject([module.id, 'could not upload']));
