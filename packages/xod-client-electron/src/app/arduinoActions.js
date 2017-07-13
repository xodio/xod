import R from 'ramda';
import os from 'os';
import fs from 'fs';
import { resolve, join as pjoin } from 'path';

import { resolvePath, writeFile, doesDirectoryExist, doesFileExist } from 'xod-fs';
import { foldEither, notEmpty, tapP, rejectWithCode } from 'xod-func-tools';
import { transpileForArduino } from 'xod-arduino';
import * as xab from 'xod-arduino-builder';

import { DEFAULT_ARDUINO_IDE_PATH, DEFAULT_ARDUINO_PACKAGES_PATH } from './constants';
import * as settings from './settings';
import * as MESSAGES from '../shared/messages';
import formatError from '../shared/errorFormatter';
import * as ERROR_CODES from '../shared/errorCodes';
import * as EVENTS from '../shared/events';
import { errorToPlainObject } from './utils';

// =============================================================================
//
// Utils
//
// =============================================================================

// :: () -> { ide :: Path, packages: Path }
const loadArduinoPaths = R.compose(
  R.applySpec({
    ide: settings.getArduinoIDE,
    packages: settings.getArduinoPackages,
  }),
  settings.load
);

/**
 * Returns a list of Boards, that was bundled into `xod-client-electron`.
 */
// :: () -> [Board]
export const getListOfBoards = R.compose(
  xab.listBoardsFromIndex,
  xab.getArduinoPackagesOfflineIndex
);

/**
 * Returns a target Board.
 * It tries to take a value from Settings, if it doesn't exist
 * it will just return Null
 */
// :: () -> Nullable Board
export const loadTargetBoard = () => R.compose(
  R.when(
    R.either(R.isNil, R.isEmpty),
    R.always(null)
  ),
  settings.getArduinoTarget,
  settings.load
)();

/**
 * Saves a specified Board into Settings and returns itself.
 */
export const saveTargetBoard = board => R.compose(
  R.always(board),
  settings.save,
  settings.setArduinoTarget(board),
  settings.load
)();

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
    return rejectWithCode(ERROR_CODES.IDE_NOT_FOUND,
      Object.assign(
        new Error('Arduino IDE not found'),
        {
          paths: getIDEPaths(ide, platform),
        }
      )
    );
  }
  if (!pkgExists) {
    // Directory could not exist if Arduino IDE is just installed and hasChanges
    // no installed packages. So there is no directory.
    // So we need to create an empty directory, to solve this problem and
    // continue installing toolchains and upload.
    const parentExists = doesDirectoryExist(resolve(pkgPath, '..'));
    if (!parentExists) {
      // If parent is also not exist — reject with error
      return rejectWithCode(ERROR_CODES.PACKAGES_NOT_FOUND,
        Object.assign(
          new Error('Arduino packages directory not found'),
          {
            paths: getPackagesPaths(packages, platform),
          }
        )
      );
    }
    fs.mkdirSync(pkgPath);
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
export const installPav = pab => Promise.all([getPAV(pab), loadArduinoPaths().ide])
  .then(
    ([pav, idePath]) => xab.installPAV(pav, idePath).then(() => pav)
  )
  .catch((err) => {
    if (err.errorCode === xab.REST_ERROR) return rejectWithCode(ERROR_CODES.INDEX_LIST_ERROR, err);
    return rejectWithCode(ERROR_CODES.INSTALL_PAV, err);
  });

/**
 * Load boards index by PAV.
 */
const loadPABs = (pav) => {
  const packagesPath = loadArduinoPaths().packages;

  return xab.loadPAVBoards(pav, packagesPath)
    .catch((err) => {
      if (err.code === 'ENOENT') {
        return xab.parseTxtConfig(xab.getDefaultBoardsTxt());
      }
      return Promise.reject(err);
    });
};

/**
 * Search installed PAV for PAB from a list of PAVs
 * @param {Object} pab PAB object of target device
 * @param {Array<Object>} pavs List of PAV objects, stored in settings
 * @returns {Promise<Object, Error>} Promise with finded PAV or Error
 */
export const getInstalledPAV = (pab, pavs, err) => R.compose(
  pav => Promise.resolve(pav),
  R.defaultTo(
    rejectWithCode(ERROR_CODES.NO_INSTALLED_PAVS, Object.assign(err, { pab, pavs }))
  ),
  R.last,
  xab.sortByVersion,
  filterByPab(pab)
)(pavs);

/**
 * Gets list of all serial ports
 * @returns {Promise<Object, Error>} Promise with Port object or Error
 * @see {@link https://www.npmjs.com/package/serialport#listing-ports}
 */
export const listPorts = () => xab.listPorts()
  .then(R.sort(R.descend(R.prop('comName'))))
  .catch(rejectWithCode(ERROR_CODES.NO_PORTS_FOUND));

// :: Port -> [Port] -> Boolean
const hasPort = R.curry((port, ports) => R.compose(
  R.gt(R.__, -1),
  R.findIndex(R.propEq('comName', port.comName))
)(ports));

/**
 * Validates that port is exist and returns Promise with the same Port object
 * or Rejected Promise with Error Code and object, that contain port
 * and list of available ports.
 */
export const checkPort = port => listPorts()
  .then(R.ifElse(
    hasPort(port),
    R.always(port),
    (ports) => { throw Object.assign(new Error(`Port ${port.comName} not found`), { port, ports }); }
  ))
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
  const tmpPath = pjoin(os.tmpdir(), 'xod-arduino-sketch.cpp');
  const clearTmp = () => fs.unlinkSync(tmpPath);

  return Promise.all([writeFile(tmpPath, code, 'utf8'), loadArduinoPaths().ide])
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
    (message, percentage, err = null) => ({
      success: false,
      progress: false,
      failure: false,
      error: err,
      message,
      percentage,
    })
  );
  const sendSuccess = send('success');
  const sendProgress = send('progress');
  const sendFailure = send('failure');
  const convertAndSendError = err => R.compose(
    msg => sendFailure(msg, 0, errorToPlainObject(err))(),
    formatError
  )(err);

  const updateArduinoPaths = ({ ide, packages }) => R.compose(
    settings.save,
    settings.setArduinoPackages(packages),
    settings.setArduinoIDE(ide),
    settings.load
  )();

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

  const boardName = payload.board.board;
  const pa = R.omit(['board', 'version'], payload.board);
  const pav = R.omit(['board'], payload.board);

  R.pipeP(
    doTranspileForArduino,
    sendProgress(MESSAGES.CODE_TRANSPILED, 10),
    code => checkPort(payload.port).then(port => ({ code, port: port.comName })),
    sendProgress(MESSAGES.PORT_FOUND, 15),
    tapP(
      () => checkArduinoIde(loadArduinoPaths(), process.platform)
        .then(updateArduinoPaths)
    ),
    sendProgress(MESSAGES.IDE_FOUND, 20),
    tapP(
      () => installPav(pav)
        .catch(err => getInstalledPAV(pav, listInstalledPAVs(), err))
        .then(R.tap(savePAV))
    ),
    sendProgress(MESSAGES.TOOLCHAIN_INSTALLED, 30),
    ({ code, port }) => loadPABs(pav)
      .then(boards => ({
        code,
        port,
        pab: R.assoc('board', xab.pickBoardIdentifierByBoardName(boardName, boards), pa),
      })),
    ({ code, port, pab }) => uploadToArduino(pab, port, code),
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

export const listPortsHandler = event => listPorts()
  .then(ports => event.sender.send(
    EVENTS.LIST_PORTS,
    {
      err: false,
      data: ports,
    }
  ))
  .catch(err => event.sender.send(
    EVENTS.LIST_PORTS,
    {
      err: true,
      data: err,
    }
  ));

export const listBoardsHandler = event => event.sender.send(
  EVENTS.LIST_BOARDS,
  {
    err: false,
    data: getListOfBoards(),
  }
);

export const loadTargetBoardHandler = event => event.sender.send(
  EVENTS.GET_SELECTED_BOARD,
  {
    err: false,
    data: loadTargetBoard(),
  }
);

export const saveTargetBoardHandler = (event, payload) => event.sender.send(
  EVENTS.SET_SELECTED_BOARD,
  {
    err: false,
    data: saveTargetBoard(payload),
  }
);
