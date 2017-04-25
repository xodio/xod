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
