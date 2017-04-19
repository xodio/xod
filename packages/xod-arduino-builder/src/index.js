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

 /** Command result
  * @typedef {Object} CmdResult
  * @property {boolean} success
  * @property {string} module
  * @property {string} message
  * @property {*} data */

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

import * as msg from './messages';

const success = R.curry((message, data) => ({ success: true, module: module.id, message, data }));
const error = R.compose(R.assoc('success', false), success);

const unwrapCmdResult = R.prop('data');

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
 * @return {Promise<CmdResult>} */
const setConfig = config =>
  Promise.resolve()
    .then(() => fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2)))
    .then(() => success(msg.CONFIG_SETTED, {}))
    .catch(err => Promise.reject(error(msg.CONFIG_SET_ERROR, err)));

/** Reads the configuration value from file at {@link CONFIG_PATH}.
 * @param {RamdaPath} [ramdaPath=[]] - Ramda path to configuration value.
 * @return {Promise<CmdResult>} */
const getConfig = (ramdaPath = []) =>
  Promise.resolve()
    .then(() => JSON.parse(fs.readFileSync(CONFIG_PATH).toString()))
    .then(R.path(ramdaPath))
    .then(success(msg.CONFIG_GETTED))
    .catch(err => Promise.reject(error(msg.CONFIG_GET_ERROR, err)));

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
 * @return {Promise<CmdResult>} */
export const setArduinoIdePathExecutable = arduinoIdePathExecutable =>
  getConfig()
    .then(unwrapCmdResult)
    .catch(() => Promise.resolve({}))
    .then(R.assocPath(ARDUINO_IDE_PATH_EXECUTABLE)(arduinoIdePathExecutable))
    .then(setConfig);

/** Sets path to Arduino IDE packages.
 * @param {Path} arduinoIdePathPackages - Path to Arduino IDE packages.
 * @return {Promise<CmdResult>} */
export const setArduinoIdePathPackages = arduinoIdePathPackages =>
  getConfig()
    .then(unwrapCmdResult)
    .catch(() => Promise.resolve({}))
    .then(R.assocPath(ARDUINO_IDE_PATH_PACKAGES)(arduinoIdePathPackages))
    .then(setConfig);

/** Lists the raw [official Arduino package index]{@link http://downloads.arduino.cc/packages/package_index.json}.
 * @return {Promise<CmdResult>} */
export const listPackageIndex = () =>
  rest.wrap(mime).wrap(errorCode)({ path: ARDUINO_PACKAGE_INDEX_URL })
    .then(R.prop('entity'))
    .then(success(msg.INDEX_LIST_GETTED))
    .catch(err => Promise.reject(error(msg.INDEX_LIST_ERROR, err)));

/** Lists the processed [official Arduino package index]{@link http://downloads.arduino.cc/packages/package_index.json}, optimized for {@link PAV} selection.
    CmdResult.data contains Map<string, PAV[]>
 * @return {Promise<CmdResult>} */
export const listPAVs = () =>
  listPackageIndex()
    .then(unwrapCmdResult)
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
    ))
    .then(success(msg.PAVS_LIST_GETTED))
    .catch(error(msg.PAVS_LIST_ERROR));

/** Installs the selected {@link PAV}.
 * @param {PAV} pav - Selected {@link PAV}.
 * @return {Promise<CmdResult>} */
export const installPAV = pav =>
  getConfig(ARDUINO_IDE_PATH_EXECUTABLE)
    .then(unwrapCmdResult)
    .then(
      arduino => new Promise(
        (resolve, reject) => {
          shelljs.exec(
            `${arduino} --install-boards ${pav.package}:${pav.architecture}:${pav.version}`,
            (code, stdout, stderr) => {
              if (code === 255) { return resolve(success(msg.PAV_ALREADY_INSTALLED, stdout)); }
              if (code === 0) { return resolve(success(msg.PAV_INSTALLED, stdout)); }
              return reject(error(msg.PAV_INSTALL_ERROR, stderr));
            }
          );
        }
      )
    );

/** Lists the boards supported by the selected {@link PAV}.
 * @param {PAV} pav - Selected {@link PAV}.
 * @return {Promise<CmdResult>} */
export const listPAVBoards = pav =>
  getConfig(ARDUINO_IDE_PATH_PACKAGES)
    .then(unwrapCmdResult)
    .then(packages => fs.readFileSync(path.resolve(packages, pav.package, 'hardware', pav.architecture, pav.version, 'boards.txt')).toString())
    .then(parseTxtConfig)
    .then(success(msg.BOARDS_LIST_GETTED))
    .catch(err => Promise.reject(error(msg.BOARDS_LIST_ERROR, err)));

/** Lists the available {@link Port}s.
  CmdResult.data contains Port[]
 * @return {Promise<CmdResult>} */
export const listPorts = () =>
  new Promise((resolve, reject) => {
    SerialPort.list((err, ports) => {
      if (err) reject(error(msg.PORTS_LIST_ERROR, err));
      else resolve(success(msg.PORTS_LIST_GETTED, ports));
    });
  });

/** Compiles the file for the selected {@link PAB}.
 * @param {PAB} pab - Package, architecture, board.
 * @param {Path} file - Path to the compilation source.
 * @return {Promise<CmdResult>} */
export const verify = (pab, file) =>
  getConfig(ARDUINO_IDE_PATH_EXECUTABLE)
    .then(unwrapCmdResult)
    .then(arduino => new Promise((resolve, reject) =>
      shelljs.exec(
        `${arduino} --verify --board "${pab.package}:${pab.architecture}:${pab.board}" "${file}"`,
        (code, stdout, stderr) => {
          if (code === 0) { return resolve(success(msg.SKETCH_VERIFIED, stdout)); }
          return reject(error(msg.SKETCH_VERIFY_ERROR, stderr));
        }
      )
    ))
    .then(({ code }) => code === 0 || Promise.reject([module.id, 'could not build']));

/** Compiles and uploads the file for the selected {@link PAB} at the specified {@link Port}.
 * @param {PAB} pab - Package, architecture, board.
 * @param {Port#comName} port - Port.
 * @param {Path} file - Path to the compilation source.
 * @return {Promise<CmdResult>} */
export const upload = (pab, port, file) =>
  getConfig(ARDUINO_IDE_PATH_EXECUTABLE)
    .then(unwrapCmdResult)
    .then(arduino => new Promise((resolve, reject) =>
      shelljs.exec(
        `${arduino} --upload --board "${pab.package}:${pab.architecture}:${pab.board}" --port "${port}" "${file}"`,
        (code, stdout, stderr) => {
          if (code === 0) { return resolve(success(msg.SKETCH_UPLOADED, stdout)); }
          return reject(error(msg.SKETCH_UPLOAD_ERROR, stderr));
        }
      )
    ));
