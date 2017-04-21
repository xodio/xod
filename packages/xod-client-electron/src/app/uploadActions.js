import R from 'ramda';
import fs from 'fs';
import { resolve } from 'path';
import { resolvePath, writeFile, isDirectoryExists, isFileExists } from 'xod-fs';
import { foldEither, notEmpty, tapP } from 'xod-func-tools';
import { transpileForArduino } from 'xod-arduino';
import * as xab from 'xod-arduino-builder';

import { DEFAULT_ARDUINO_IDE_PATH, DEFAULT_ARDUINO_PACKAGES_PATH } from './constants';
import * as ERROR_CODES from './errorCodes';

// =============================================================================
//
// Utils
//
// =============================================================================

// :: ERROR_CODE -> Error -> Promise.Reject<Error>
const rejectWithCode = R.curry(
  (code, err) => Promise.reject(Object.assign(err, { errorCode: code }))
);

// :: String[] -> String -> String -> String[]
const getPaths = R.curry(
  (pathsForPlatforms, fromSettings, platform) => R.compose(
    R.map(resolvePath),
    R.concat(R.of(fromSettings)),
    R.propOr('', platform)
  )(pathsForPlatforms)
);
// :: String -> String -> String[]
const getIDEPaths = getPaths(DEFAULT_ARDUINO_IDE_PATH);
// :: String -> String -> String[]
const getPackagesPaths = getPaths(DEFAULT_ARDUINO_PACKAGES_PATH);
// :: (a -> Boolean) -> (String[] -> String)
const checkArrayOfStrings = pred => R.reduceWhile(R.complement(pred), (acc, str) => str, null);
// :: String[] -> String
const anyFileThatExist = checkArrayOfStrings(isFileExists);
// :: String[] -> String
const anyDirectoryThatExist = checkArrayOfStrings(isDirectoryExists);

// :: PAB -> PAV
const getPAV = pab => R.composeP(
  R.last,
  R.prop(`${pab.package}:${pab.architecture}`),
  xab.listPAVs
)();
// :: PAB -> (PAV[] -> PAV[])
const filterByPab = pab => R.filter(R.both(
  R.propEq('package', pab.package),
  R.propEq('architecture', pab.architecture)
));
// :: PAV[] -> PAV[]
const sortByVersion = R.sort(R.descend(R.prop('version')));

// :: Port[] -> Port
const findPort = R.find(
  R.anyPass([
    R.propEq('vendorId', '0x2341'),
    R.compose(
      R.complement(R.test(/bluetooth/i)),
      R.prop('comName')
    ),
  ])
);

// =============================================================================
//
// Upload actions
//
// =============================================================================

/**
 * Check paths to Arduino executables and packages
 * @param {String} ide Path to executable, stored in settings
 * @param {String} packages Path to packages folder, stored in settings
 * @param {String} platform OS platform to get default paths
 * @returns {Promise<Object, Error>} Promise with verified paths
 */
export const checkArduinoIde = ({ ide, packages }, platform) => {
  const idePath = anyFileThatExist(getIDEPaths(ide, platform));
  const pkgPath = anyDirectoryThatExist(getPackagesPaths(packages, platform));

  const ideExists = R.both(isFileExists, notEmpty)(idePath);
  const pkgExists = R.both(isDirectoryExists, notEmpty)(pkgPath);

  if (!R.and(ideExists, pkgExists)) {
    return rejectWithCode(ERROR_CODES.IDE_NOT_FOUND, new Error());
  }

  return xab.setArduinoIdePathPackages(pkgPath)
    .then(() => xab.setArduinoIdePathExecutable(idePath))
    .then(() => ({ ide: idePath, packages: pkgPath }));
};

/**
 * Install PAV for selected PAB
 * @param {Object} pab See type PAB from `xod-arduino-builder`
 * @returns {Promise<Object, Error>} Promise with PAV object or Error
 */
export const installPav = pab => getPAV(pab)
  .then(tapP(xab.installPAV))
  .catch((err) => {
    if (err === xab.REST_ERROR) return rejectWithCode(ERROR_CODES.INDEX_LIST_ERROR, new Error());
    return rejectWithCode(ERROR_CODES.INSTALL_PAV, err);
  });

/**
 * Search installed PAV for PAB from a list of PAVs
 * @param {Object} pab PAB object of target device
 * @param {Array<Object>} pavs List of PAV objects, stored in settings
 * @returns {Promise<Object, Error>} Promise with finded PAV or Error
 */
export const getInstalledPAV = (pab, pavs) => R.compose(
  pav => Promise.resolve(pav),
  R.defaultTo(
    rejectWithCode(ERROR_CODES.NO_INSTALLED_PAVS, new Error())
  ),
  R.head,
  sortByVersion,
  filterByPab(pab)
)(pavs);

/**
 * Get list of all serial ports and find one with connected Arduino device
 * @returns {Promise<Object, Error>} Promise with Port object or Error
 * @see {@link https://www.npmjs.com/package/serialport#listing-ports}
 */
export const getPort = () => xab.listPorts()
  .then(R.compose(
    R.ifElse(
      R.isNil,
      () => Promise.reject(new Error()),
      port => Promise.resolve(port)
    ),
    R.propOr(null, 'comName'),
    findPort
  ))
  .catch(rejectWithCode(ERROR_CODES.PORT_NOT_FOUND));

/**
 * Transpile code for Arduino
 * @param {Project} project
 * @param {PatchPath} patchId Entry-point patch path
 * @returns {Promise<String, Error>} Promise with transpiled code or Error
 */
export const doTranspileForArduino = ({ project, patchId }) =>
  Promise.resolve(project)
    .then(v2 => transpileForArduino(v2, patchId))
    .then(foldEither(
      rejectWithCode(ERROR_CODES.TRANSPILE_ERROR),
      code => Promise.resolve(code)
    ));

/**
 * Upload transpiled code to specified device at specified port
 * @param {Object} pab
 * @param {Object} port
 * @param {String} code
 * @returns {Promise<String, Error>} Promise with Stdout or Error
 */
export const uploadToArduino = (pab, port, code) => {
  // TODO: Replace tmpPath with normal path.
  //       Somehow app.getPath('temp') is not working.
  //       Arduino IDE returns "readdirent: result is too long".
  const tmpPath = resolve(__dirname, 'upload.tmp.cpp');
  const clearTmp = () => fs.unlinkSync(tmpPath);

  return writeFile(tmpPath, code)
    .then(({ path }) => xab.upload(pab, port, path))
    .then(R.tap(clearTmp))
    .catch((err) => {
      clearTmp();
      return rejectWithCode(ERROR_CODES.UPLOAD_ERROR, err);
    });
};
