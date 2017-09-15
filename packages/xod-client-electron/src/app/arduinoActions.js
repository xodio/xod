import R from 'ramda';
import os from 'os';
import fse from 'fs-extra';
import { resolve, join as pjoin } from 'path';

import { app } from 'electron';
import { writeFile } from 'xod-fs';
import { foldEither, tapP, rejectWithCode } from 'xod-func-tools';
import { transpileForArduino } from 'xod-arduino';
import * as xad from 'xod-arduino-deploy';
import * as xd from 'xod-deploy';

import * as settings from './settings';
import * as MESSAGES from '../shared/messages';
import formatError from '../shared/errorFormatter';
import * as ERROR_CODES from '../shared/errorCodes';
import * as EVENTS from '../shared/events';
import { errorToPlainObject, IS_DEV } from './utils';

// =============================================================================
//
// Computed paths
//
// =============================================================================
const arduinoPackagesPath = resolve(app.getPath('userData'), 'packages');
const arduinoBuilderPlatformMap = {
  win32: 'win',
  linux: 'linux',
  darwin: 'mac',
};

const arduinoBuilderPath = (IS_DEV) ?
  resolve(app.getAppPath(), 'arduino-builders', arduinoBuilderPlatformMap[os.platform()]) :
  resolve(process.resourcesPath, 'arduino-builder');

const arduinoLibrariesPath = resolve(
  IS_DEV ? app.getAppPath() : process.resourcesPath,
  'arduino-libraries'
);

const artifactTmpDir = resolve(app.getPath('userData'), 'upload-temp');

// Another place to store uploader tools
// Will be used by xod-deploy (cloud compiler)
const uploadToolsPath = resolve(
  app.getPath('userData'), 'tools'
);

// =============================================================================
//
// Utils
//
// =============================================================================

/**
 * Returns a list of Boards, that was bundled into `xod-client-electron`.
 */
// :: () -> [Board]
export const getListOfBoards = () => xad.listBoardsFromIndex(xad.packageIndex);

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
  settings.getUploadTarget,
  settings.load
)();

/**
 * Saves a specified Board into Settings and returns itself.
 */
export const saveTargetBoard = board => R.compose(
  R.always(board),
  settings.save,
  settings.setUploadTarget(board),
  settings.load
)();

// =============================================================================
//
// Upload actions
//
// =============================================================================
/**
 * Install hardware data and tools by fqbn
 */
export const installPackage = fqbn => xad.installArchitecture(
  fqbn, arduinoPackagesPath, xad.packageIndex
).catch(rejectWithCode(ERROR_CODES.CANT_INSTALL_ARCHITECTURE));

/**
 * Gets list of all serial ports
 * @returns {Promise<Object, Error>} Promise with Port object or Error
 * @see {@link https://www.npmjs.com/package/serialport#listing-ports}
 */
export const listPorts = () => xad.listPorts()
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
  // Create tmpDir in userData instead of os.tmpdir() to avoid error "readdirent: result too large
  const sketchFile = pjoin(artifactTmpDir, 'xod-arduino-sketch.cpp');
  const buildDir = pjoin(artifactTmpDir, 'build');
  const clearTmp = () => fse.remove(artifactTmpDir);

  return writeFile(sketchFile, code, 'utf8')
    .then(({ path }) => xad.buildAndUpload(
      path, pab, arduinoPackagesPath, arduinoLibrariesPath, buildDir, port, arduinoBuilderPath
    ))
    .then(tapP(clearTmp))
    .catch(
      err => clearTmp().then(() => rejectWithCode(ERROR_CODES.UPLOAD_ERROR, err))
    );
};

// :: String -> [Board] -> Board
const findBoardByName = R.curry(
  (boardName, boards) => R.find(R.propEq('name', boardName), boards)
);

// =============================================================================
//
// Local compiling and uploading case
//
// =============================================================================

const deployToArduino = ({
  payload,
  sendProgress,
  sendSuccess,
}) => {
  const boardName = payload.board.name;
  const boardCpuId = payload.board.cpuId;
  const { package: pkg, architecture } = payload.board;
  const fqbn = `${pkg}:${architecture}:unknown`;

  return R.pipeP(
    doTranspileForArduino,
    sendProgress(MESSAGES.CODE_TRANSPILED, 10),
    code => checkPort(payload.port).then(port => ({ code, port: port.comName })),
    sendProgress(MESSAGES.PORT_FOUND, 15),
    tapP(() => installPackage(fqbn)),
    sendProgress(MESSAGES.TOOLCHAIN_INSTALLED, 30),
    ({ code, port }) => xad.loadPABs(fqbn, arduinoPackagesPath)
      .then(boards => ({
        code,
        port,
        pab: R.compose(
          R.assoc('cpu', boardCpuId),
          findBoardByName(boardName)
        )(boards),
      })),
    ({ code, port, pab }) => uploadToArduino(xad.strigifyFQBN(pab), port, code),
    (result) => {
      if (result.exitCode !== 0) {
        return Promise.reject(Object.assign(new Error(`Upload tool exited with error code: ${result.exitCode}`), result));
      }
      return sendSuccess([result.stderr, result.stdout].join('\n\n'), 100)();
    }
  )(payload);
};

// =============================================================================
//
// Cloud compiling and uploading case
//
// =============================================================================

// :: UploadConfig -> Promise Path Error
const installTool = R.converge(
  xd.installTool(uploadToolsPath),
  [
    xd.getToolVersionPath,
    xd.getToolUrl,
  ]
);

const deployToArduinoThroughCloud = ({
  payload,
  sendProgress,
  sendSuccess,
}) => R.pipeP(
  doTranspileForArduino,
  sendProgress(MESSAGES.CODE_TRANSPILED, 10),
  code => checkPort(payload.port).then(port => ({ code, port: port.comName })),
  sendProgress(MESSAGES.PORT_FOUND, 15),
  ({ code, port }) => ({ code, port, pio: payload.board.pio }),
  data => xd.getUploadConfig(data.pio)
    .then(cfg => R.assoc('uploadConfig', cfg, data))
    .catch((err) => {
      const errCode = R.cond([
        [R.propEq('status', 404), R.always(ERROR_CODES.BOARD_NOT_SUPPORTED)],
        [R.has('status'), R.always(ERROR_CODES.CANT_GET_UPLOAD_CONFIG)],
        [R.T, R.always(ERROR_CODES.CLOUD_NETWORK_ERROR)],
      ])(err);

      return rejectWithCode(errCode, err);
    }),
  data => installTool(data.uploadConfig)
    .then(res => R.assoc('toolPath', res.path, data)),
  sendProgress(MESSAGES.CLOUD_TOOLCHAIN_INSTALLED, 30),
  data => xd.compile(data.pio, data.code)
    .then(xd.saveCompiledBinary(artifactTmpDir))
    .then(artifactPath => R.assoc('artifactPath', artifactPath, data)),
  sendProgress(MESSAGES.CODE_COMPILED, 75),
  ({ uploadConfig, toolPath, artifactPath, port }) =>
    xd.upload(uploadConfig, { toolPath, artifactPath, port }),
  (result) => {
    if (result.exitCode !== 0) {
      return Promise.reject(Object.assign(new Error(`Upload tool exited with error code: ${result.exitCode}`), result));
    }
    return sendSuccess([result.stderr, result.stdout].join('\n\n'), 100)();
  }
)(payload);

// =============================================================================
//
// IPC handlers (for main process)
//
// =============================================================================

export const uploadToArduinoHandler = (event, payload) => {
  let lastPercentage = 0;
  // Messages
  const send = status => R.compose(
    data => (arg) => { event.sender.send('UPLOAD_TO_ARDUINO', data); return arg; },
    R.assoc(status, true),
    (message, percentage, err = null) => {
      lastPercentage = percentage;
      return {
        success: false,
        progress: false,
        failure: false,
        error: err,
        message,
        percentage,
      };
    }
  );
  const sendSuccess = send('success');
  const sendProgress = send('progress');
  const sendFailure = send('failure');
  const convertAndSendError = err => R.compose(
    msg => sendFailure(msg, lastPercentage, errorToPlainObject(err))(),
    formatError
  )(err);

  const opts = {
    payload,
    sendProgress,
    sendSuccess,
  };

  const deployFn = (payload.cloud) ? deployToArduinoThroughCloud : deployToArduino;

  return deployFn(opts).catch(convertAndSendError);
};

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
