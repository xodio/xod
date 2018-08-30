import * as R from 'ramda';
import os from 'os';
import fse from 'fs-extra';
import { resolve, join as pjoin } from 'path';

import { app } from 'electron';
import { writeFile } from 'xod-fs';
import { tapP, rejectWithCode, delay } from 'xod-func-tools';
import * as xad from 'xod-arduino-deploy';
import * as xd from 'xod-deploy';

import * as settings from './settings';
import * as MESSAGES from '../shared/messages';
import formatError from '../shared/errorFormatter';
import * as ERROR_CODES from '../shared/errorCodes';
import * as EVENTS from '../shared/events';
import {
  createSystemMessage,
  parseDebuggerMessage,
  createErrorMessage,
} from '../shared/debuggerMessages';
import { errorToPlainObject, IS_DEV } from './utils';
import { getArdulibsPath } from './arduinoDependencies';

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

const arduinoBuilderPath = IS_DEV
  ? resolve(
      app.getAppPath(),
      'arduino-builders',
      arduinoBuilderPlatformMap[os.platform()]
    )
  : resolve(process.resourcesPath, 'arduino-builder');

const arduinoLibrariesPath = resolve(
  IS_DEV ? app.getAppPath() : process.resourcesPath,
  'arduino-libraries'
);

const artifactTmpDir = resolve(app.getPath('userData'), 'upload-temp');

// Another place to store uploader tools
// Will be used by xod-deploy (cloud compiler)
const uploadToolsPath = resolve(app.getPath('userData'), 'tools');

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
export const loadTargetBoard = () =>
  R.compose(
    R.when(R.either(R.isNil, R.isEmpty), R.always(null)),
    settings.getUploadTarget,
    settings.load
  )();

/**
 * Saves a specified Board into Settings and returns itself.
 */
export const saveTargetBoard = board =>
  R.compose(
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
export const installPackage = fqbn =>
  xad
    .installArchitecture(fqbn, arduinoPackagesPath, xad.packageIndex)
    .catch(rejectWithCode(ERROR_CODES.CANT_INSTALL_ARCHITECTURE));

/**
 * Gets list of all serial ports
 * @returns {Promise<Object, Error>} Promise with Port object or Error
 * @see {@link https://www.npmjs.com/package/serialport#listing-ports}
 */
export const listPorts = () =>
  xad
    .listPorts()
    .then(R.sort(R.descend(R.prop('comName'))))
    .catch(rejectWithCode(ERROR_CODES.NO_PORTS_FOUND));

// :: Port -> [Port] -> Boolean
const hasPort = R.curry((port, ports) =>
  R.compose(R.gt(R.__, -1), R.findIndex(R.propEq('comName', port.comName)))(
    ports
  )
);

/**
 * Validates that port is exist and returns Promise with the same Port object
 * or Rejected Promise with Error Code and object, that contain port
 * and list of available ports.
 */
export const checkPort = port =>
  listPorts()
    .then(
      R.ifElse(hasPort(port), R.always(port), ports => {
        throw Object.assign(new Error(`Port ${port.comName} not found`), {
          port,
          ports,
        });
      })
    )
    .catch(rejectWithCode(ERROR_CODES.PORT_NOT_FOUND));

/**
 * Upload transpiled code to specified device at specified port
 * @param {Object} pab
 * @param {Object} port
 * @param {String} code
 * @returns {Promise<String, Error>} Promise with Stdout or Error
 */
export const uploadToArduino = (
  pab,
  port,
  code,
  ardulibsPath,
  onBuildStdout = () => {}
) => {
  // Create tmpDir in userData instead of os.tmpdir() to avoid error "readdirent: result too large
  const sketchFile = pjoin(artifactTmpDir, 'xod-arduino-sketch.cpp');
  const buildDir = pjoin(artifactTmpDir, 'build');
  const clearTmp = () => fse.remove(artifactTmpDir);

  let libPaths = [arduinoLibrariesPath];

  return writeFile(sketchFile, code, 'utf8')
    .then(
      tapP(() =>
        fse.pathExists(ardulibsPath).then(exists => {
          if (exists) {
            libPaths = R.append(ardulibsPath, libPaths);
          }
        })
      )
    )
    .then(({ path }) =>
      xad.buildAndUpload(
        path,
        pab,
        arduinoPackagesPath,
        libPaths,
        buildDir,
        port,
        arduinoBuilderPath,
        onBuildStdout
      )
    )
    .then(tapP(clearTmp))
    .catch(err =>
      clearTmp().then(() => rejectWithCode(ERROR_CODES.UPLOAD_ERROR, err))
    );
};

// :: String -> [Board] -> Board
const findBoardById = R.curry((id, boards) =>
  R.find(R.propEq('boardIdentifier', id), boards)
);

// =============================================================================
//
// Local compiling and uploading case
//
// =============================================================================

const deployToArduino = ardulibsPath => ({
  payload,
  sendProgress,
  sendSuccess,
}) => {
  const boardId = payload.board.boardsTxtId;
  const boardCpuId = payload.board.cpuId;
  const { package: pkg, architecture } = payload.board;
  const fqbn = `${pkg}:${architecture}:unknown`;

  return R.pipeP(
    sendProgress(MESSAGES.CODE_TRANSPILED, 10),
    () => checkPort(payload.port).then(port => ({ port: port.comName })),
    sendProgress(MESSAGES.PORT_FOUND, 15),
    tapP(() => installPackage(fqbn)),
    sendProgress(MESSAGES.TOOLCHAIN_INSTALLED, 30),
    ({ port }) =>
      xad.loadPABs(fqbn, arduinoPackagesPath).then(boards => ({
        port,
        pab: R.compose(R.assoc('cpu', boardCpuId), findBoardById(boardId))(
          boards
        ),
      })),
    ({ port, pab }) =>
      uploadToArduino(
        xad.strigifyFQBN(pab),
        port,
        payload.code,
        ardulibsPath,
        buildStdout => {
          sendProgress(buildStdout, 60)();
        }
      ),
    result => {
      if (result.exitCode !== 0) {
        return Promise.reject(
          Object.assign(
            new Error(`Upload tool exited with error code: ${result.exitCode}`),
            result
          )
        );
      }
      sendSuccess([result.stdout, result.stderr].join('\n\n'), 100)();

      return result;
    }
  )(Promise.resolve());
};

// =============================================================================
//
// Cloud compiling and uploading case
//
// =============================================================================

// :: UploadConfig -> Promise Path Error
const installTool = R.converge(xad.installTool(uploadToolsPath), [
  xd.getToolVersionPath,
  xd.getToolUrl,
]);

const deployToArduinoThroughCloud = ({
  payload,
  sendProgress,
  sendSuccess,
}) => {
  const { code } = payload;
  const pio = payload.board.pio;

  return R.pipeP(
    sendProgress(MESSAGES.CODE_TRANSPILED, 10),
    () =>
      checkPort(payload.port).then(port => ({
        port: port.comName,
      })),
    sendProgress(MESSAGES.PORT_FOUND, 15),
    ({ port }) =>
      xd
        .getUploadConfig(pio)
        .then(uploadConfig => ({ port, uploadConfig }))
        .catch(err => {
          const errCode = R.cond([
            [
              R.propEq('status', 404),
              R.always(ERROR_CODES.BOARD_NOT_SUPPORTED),
            ],
            [R.has('status'), R.always(ERROR_CODES.CANT_GET_UPLOAD_CONFIG)],
            [R.T, R.always(ERROR_CODES.CLOUD_NETWORK_ERROR)],
          ])(err);

          return rejectWithCode(errCode, err);
        }),
    data =>
      installTool(data.uploadConfig).then(res =>
        R.assoc('toolPath', res.path, data)
      ),
    sendProgress(MESSAGES.CLOUD_TOOLCHAIN_INSTALLED, 30),
    data =>
      xd
        .compile(pio, code)
        .then(xd.saveCompiledBinary(artifactTmpDir))
        .then(artifactPath => R.assoc('artifactPath', artifactPath, data)),
    sendProgress(MESSAGES.CODE_COMPILED, 75),
    ({ uploadConfig, toolPath, artifactPath, port }) =>
      xd.upload(uploadConfig, { toolPath, artifactPath, port }),
    result => {
      if (result.exitCode !== 0) {
        return Promise.reject(
          Object.assign(
            new Error(`Upload tool exited with error code: ${result.exitCode}`),
            result
          )
        );
      }
      sendSuccess([result.stderr, result.stdout].join('\n\n'), 100)();

      return result;
    }
  )(Promise.resolve());
};

// =============================================================================
//
// Debug
//
// =============================================================================

const debug = async (port, onData, onClose) => {
  const ports = await xad.listPorts();
  const newPort = R.find(
    R.allPass([
      R.propEq('manufacturer', port.manufacturer),
      R.propEq('vendorId', port.vendorId),
      R.propEq('serialNumber', port.serialNumber),
      R.propEq('productId', port.productId),
    ]),
    ports
  );

  if (!newPort) {
    return rejectWithCode(
      ERROR_CODES.DEVICE_NOT_FOUND_FOR_DEBUG,
      new Error('Device for debug is not found')
    );
  }

  const portName = R.prop('comName', port);

  return delay(400).then(() => xad.openAndReadPort(portName, onData, onClose));
};

const isDeviceNotFound = R.propEq(
  'errorCode',
  ERROR_CODES.DEVICE_NOT_FOUND_FOR_DEBUG
);

// =============================================================================
//
// IPC handlers (for main process)
//
// =============================================================================

/**
 * Handler for starting debug session.
 * - `storeFn`   - is a function, that used to store reference to port,
 *                 to close connection with it on next upload or on stop
 *                 debug session
 * - `onCloseCb` - is a function, that called on any "close" event occured
 *                 on SerialPort object. It called one argument:
 *                 - `sendErr` function, that send error "Lost connection",
 *                   only main process knows is connection closed by user or
 *                   really error occured, so it's passed as argument and
 *                   called in the main process.
 */
export const startDebugSessionHandler = (storeFn, onCloseCb) => (
  event,
  { port }
) => {
  let triesToSearchDevice = 0;
  const maxTriesToSearch = 7;
  const searchDelay = 300;

  let messageCollector = [];
  const throttleDelay = 100; // ms

  const intervalId = setInterval(() => {
    if (messageCollector.length > 0) {
      event.sender.send(EVENTS.DEBUG_SESSION, messageCollector);
      messageCollector = [];
    }
  }, throttleDelay);

  const onData = data => {
    messageCollector = R.append(parseDebuggerMessage(data), messageCollector);
  };
  const onClose = () => {
    clearInterval(intervalId);
    onCloseCb(() => {
      const errorMessage = R.compose(
        R.omit('stack'), // Lost connection is not a big deal, we don't want a stacktrace here
        createErrorMessage
      )(new Error(MESSAGES.DEBUG_LOST_CONNECTION));
      event.sender.send(EVENTS.DEBUG_SESSION, [errorMessage]);
    });
    event.sender.send(
      EVENTS.STOP_DEBUG_SESSION,
      createSystemMessage('Debug session stopped')
    );
  };

  const runDebug = () =>
    debug(port, onData, onClose).catch(async err => {
      if (triesToSearchDevice >= maxTriesToSearch || !isDeviceNotFound(err)) {
        return err;
      }

      triesToSearchDevice += 1;
      await delay(searchDelay);
      return await runDebug();
    });

  return runDebug()
    .then(R.tap(debugPort => storeFn(debugPort, intervalId)))
    .catch(err => {
      clearInterval(intervalId);
      event.sender.send(EVENTS.DEBUG_SESSION, [createErrorMessage(err)]);
    });
};

export const stopDebugSessionHandler = (event, port) => xad.closePort(port);

export const uploadToArduinoHandler = (event, payload, wsPath) => {
  let lastPercentage = 0;
  // Messages
  const send = status =>
    R.compose(
      data => arg => {
        event.sender.send('UPLOAD_TO_ARDUINO', data);
        return arg;
      },
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

  // :: (message, percentage, error) -> a -> a
  const sendSuccess = send('success');
  const sendProgress = send('progress');
  const sendFailure = send('failure');
  const convertAndSendError = err =>
    R.compose(
      msg => sendFailure(msg, lastPercentage, errorToPlainObject(err))(),
      formatError
    )(err);

  const ardulibsPath = getArdulibsPath(wsPath);

  const deployFn = payload.cloud
    ? deployToArduinoThroughCloud
    : deployToArduino(ardulibsPath);

  return deployFn({
    payload,
    sendProgress,
    sendSuccess,
  }).catch(convertAndSendError);
};

export const listPortsHandler = event =>
  listPorts()
    .then(ports =>
      event.sender.send(EVENTS.LIST_PORTS, {
        err: false,
        data: ports,
      })
    )
    .catch(err =>
      event.sender.send(EVENTS.LIST_PORTS, {
        err: true,
        data: err,
      })
    );

export const listBoardsHandler = event =>
  event.sender.send(EVENTS.LIST_BOARDS, {
    err: false,
    data: getListOfBoards(),
  });

export const loadTargetBoardHandler = event =>
  event.sender.send(EVENTS.GET_SELECTED_BOARD, {
    err: false,
    data: loadTargetBoard(),
  });

export const saveTargetBoardHandler = (event, payload) =>
  event.sender.send(EVENTS.SET_SELECTED_BOARD, {
    err: false,
    data: saveTargetBoard(payload),
  });
