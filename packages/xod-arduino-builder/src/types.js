import $ from 'sanctuary-def';
import HMDef from 'hm-def';
import XF from 'xod-func-tools';

/* Types are by convention starts with a capital leter, so: */
/* eslint-disable new-cap */

const packageName = 'xod-arduino-builder';
const docUrl = 'http://xod.io/docs/dev/xod-arduino-builder/#';

//-----------------------------------------------------------------------------
//
// Type utilities
//
//-----------------------------------------------------------------------------

const Model = XF.Model(packageName, docUrl);
const AliasType = XF.AliasType(packageName, docUrl);

//-----------------------------------------------------------------------------
//
// Domain types
//
//-----------------------------------------------------------------------------

/** Lens
 * @typedef {Function} Lens
 * @see {@link http://ramdajs.com/docs/#lensProp} */

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

export const ArduinoPackageIndex = AliasType('ArduinoPackageIndex', $.Object);

export const BoardIdentifier = AliasType('BoardIdentifier', $.String);
export const BoardName = AliasType('BoardName', $.String);
export const Board = Model('Board', {
  architecture: $.String,
  package: $.String,
  version: $.String,
  board: BoardName,
});

/** Package, architecture, version. */
export const PAV = Model('PAV', {
  architecture: $.String,
  package: $.String,
  version: $.String,
});

/** Package, architecture, board. */
export const PAB = Model('PAB', {
  architecture: $.String,
  package: $.String,
  board: BoardIdentifier,
});

export const PortName = AliasType('PortName', $.String);
/** Serial port object.
* @typedef {Object} Port
* @property {string} comName - The {@link Path} or identifier used to open the serial port.
* @see {@link https://www.npmjs.com/package/serialport#listing-ports} */
export const Port = Model('Port', {
  comName: PortName,
});

 /** Result object of any execution of shell command
  * @typedef {Object} ExecResult
  * @property {Number} code Exit code or error code
  * @property {String} stdout Content from stdout
  * @property {String} stderr Content from stderr
  */

 /** Result object of any execution of shell command
  * @typedef {Object} WriteResult
  * @property {String} path Path to written file
  * @property {String} data Content that was written
  * @see function `writeFile` in pacakge `xod-fs`
  */

/** xod-arduino-builder config
 * @typedef {Object} Config
 * @property {string} arduino_ide_executable
 * @property {string} arduino_ide_packages
 */

//-----------------------------------------------------------------------------
//
// Environment
//
//-----------------------------------------------------------------------------
const env = XF.env.concat([
  Port,
  PortName,
  PAV,
  PAB,
  Board,
  BoardName,
  BoardIdentifier,
  ArduinoPackageIndex,
]);

export const def = HMDef.create({
  checkTypes: process.env.NODE_ENV !== 'production',
  env,
});

export default def;
