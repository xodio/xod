import R from 'ramda';
import fs from 'fs';
import { resolve } from 'path';
import { resolvePath, writeFile, doesDirectoryExist, doesFileExist } from 'xod-fs';
import { foldEither, notEmpty, tapP, rejectWithCode } from 'xod-func-tools';
import { transpileForArduino } from 'xod-arduino';
import * as xab from 'xod-arduino-builder';

import { DEFAULT_ARDUINO_IDE_PATH, DEFAULT_ARDUINO_PACKAGES_PATH } from './constants';
import * as settings from './settings';
import * as MESSAGES from '../shared/messages';
import formatError from '../shared/errorFormatter';
import * as ERROR_CODES from '../shared/errorCodes';

// =============================================================================
//
// Utils
//
// =============================================================================

// :: String[] -> String -> String -> String[]
const getPaths = R.curry(
  (pathsForPlatforms, fromSettings, platform) => R.compose(
    R.map(resolvePath),
    R.reject(R.isEmpty),
    R.concat(R.of(fromSettings)),
    R.propOr('', platform)
  )(pathsForPlatforms)
);
// :: String -> String -> String[]
const getIDEPaths = getPaths(DEFAULT_ARDUINO_IDE_PATH);
// :: String -> String -> String[]
const getPackagesPaths = getPaths(DEFAULT_ARDUINO_PACKAGES_PATH);
// :: (a -> Boolean) -> (String[] -> String)
const checkArrayOfStrings = pred => R.reduceWhile(
  acc => R.either(R.isNil, R.complement(pred))(acc),
  (acc, str) => str,
  null
);
// :: String[] -> String
const anyFileThatExist = checkArrayOfStrings(doesFileExist);
// :: String[] -> String
const anyDirectoryThatExist = checkArrayOfStrings(doesDirectoryExist);

// :: PAB -> PAV
const getPAV = pab => R.pipeP(
  xab.loadPackageIndex,
  xab.listPAVs,
  R.prop(`${pab.package}:${pab.architecture}`),
  R.last
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

// :: () -> Promise String Error
const getArduinoIDE = R.pipeP(
  xab.loadConfig,
  xab.getArduinoIdePathExecutable
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

  const ideExists = R.both(doesFileExist, notEmpty)(idePath);
  const pkgExists = R.both(doesDirectoryExist, notEmpty)(pkgPath);

  if (!ideExists) {
    return rejectWithCode(ERROR_CODES.IDE_NOT_FOUND, { path: ide });
  }
  if (!pkgExists) {
    return rejectWithCode(ERROR_CODES.PACKAGES_NOT_FOUND, { path: packages });
  }

  return R.pipeP(
    xab.loadConfig,
    xab.setArduinoIdePathPackages(pkgPath),
    xab.setArduinoIdePathExecutable(idePath),
    xab.saveConfig,
    () => ({ ide: idePath, packages: pkgPath })
  )();
};

/**
 * Install PAV for selected PAB
 * @param {Object} pab See type PAB from `xod-arduino-builder`
 * @returns {Promise<Object, Error>} Promise with PAV object or Error
 */
export const installPav = pab => Promise.all([getPAV(pab), getArduinoIDE()])
  .then(tapP(
    ([pav, idePath]) => xab.installPAV(pav, idePath)
  ))
  .catch((err) => {
    if (err.errorCode === xab.REST_ERROR) return rejectWithCode(ERROR_CODES.INDEX_LIST_ERROR, err);
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
    rejectWithCode(ERROR_CODES.NO_INSTALLED_PAVS, { pab })
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
  .then(ports => R.compose(
    R.ifElse(
      R.isNil,
      () => Promise.reject({ ports }),
      port => Promise.resolve(port)
    ),
    R.propOr(null, 'comName'),
    findPort
  )(ports))
  .catch(rejectWithCode(ERROR_CODES.PORT_NOT_FOUND));

/**
 * Transpile code for Arduino
 * @param {Project} project
 * @param {PatchPath} patchPath Entry-point patch path
 * @returns {Promise<String, Error>} Promise with transpiled code or Error
 */
export const doTranspileForArduino = ({ project, patchPath }) =>
  Promise.resolve(project)
    .then(p => transpileForArduino(p, patchPath))
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

  return Promise.all([writeFile(tmpPath, code), getArduinoIDE()])
    .then(
      ([{ path }, idePath]) => xab.upload(pab, port, path, idePath)
    )
    .then(R.tap(clearTmp))
    .catch((err) => {
      clearTmp();
      return rejectWithCode(ERROR_CODES.UPLOAD_ERROR, err);
    });
};

// =============================================================================
//
// IPC handlers (for main process)
//
// =============================================================================

export const uploadToArduinoHandler = (event, payload) => {
  // Messages
  const send = status => R.compose(
    data => (arg) => { event.sender.send('UPLOAD_TO_ARDUINO', data); return arg; },
    R.assoc(status, true),
    (message, percentage, errCode = null) => ({
      success: false,
      progress: false,
      failure: false,
      errorCode: errCode,
      message,
      percentage,
    })
  );
  const sendSuccess = send('success');
  const sendProgress = send('progress');
  const sendFailure = send('failure');
  const convertAndSendError = err => R.compose(
    msg => sendFailure(msg, 0, err.errorCode)(),
    formatError
  )(err);

  const updateArduinoPaths = ({ ide, packages }) => R.compose(
    settings.save,
    settings.setArduinoPackages(packages),
    settings.setArduinoIDE(ide),
    settings.load
  )();

  const getArduinoPaths = R.compose(
    R.applySpec({
      ide: settings.getArduinoIDE,
      packages: settings.getArduinoPackages,
    }),
    settings.load
  );

  const listInstalledPAVs = R.compose(
    settings.listPAVs,
    settings.load
  );
  const appendPAV = R.curry(
    (pav, allSettings) => R.compose(
      settings.assocPAVs(R.__, allSettings),
      R.unless(
        R.find(R.equals(pav)),
        R.append(pav)
      ),
      settings.listPAVs
    )(allSettings)
  );
  const savePAV = pav => R.compose(
    settings.save,
    appendPAV(pav),
    settings.load
  )();

  R.pipeP(
    doTranspileForArduino,
    sendProgress(MESSAGES.CODE_TRANSPILED, 10),
    code => getPort().then(port => ({ code, port })),
    sendProgress(MESSAGES.PORT_FOUND, 15),
    tapP(
      () => checkArduinoIde(getArduinoPaths(), process.platform)
        .then(updateArduinoPaths)
    ),
    sendProgress(MESSAGES.IDE_FOUND, 20),
    tapP(
      () => installPav(payload.pab)
        .catch(() => getInstalledPAV(payload.pab, listInstalledPAVs()))
        .then(R.tap(savePAV))
    ),
    sendProgress(MESSAGES.TOOLCHAIN_INSTALLED, 30),
    ({ code, port }) => uploadToArduino(payload.pab, port, code),
    stdout => sendSuccess(stdout, 100)()
  )(payload).catch(convertAndSendError);
};

export const setArduinoIDEHandler = (event, payload) => R.compose(
  () => event.sender.send('SET_ARDUINO_IDE', {
    code: 0,
    message: MESSAGES.ARDUINO_PATH_CHANGED,
  }),
  settings.save,
  settings.setArduinoIDE(payload.path),
  settings.load
)();
