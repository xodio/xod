import path from 'path';
import * as R from 'ramda';
import * as fse from 'fs-extra';
import * as xd from 'xod-deploy';
import * as xdb from 'xod-deploy-bin';
import { createError } from 'xod-func-tools';

import subscribeIpc from './subscribeIpc';
import { loadWorkspacePath } from './workspaceActions';
import {
  LIST_BOARDS,
  UPLOAD_TO_ARDUINO,
  UPDATE_INDEXES,
  CHECK_ARDUINO_DEPENDENCY_UPDATES,
  UPGRADE_ARDUINO_DEPENDECIES,
} from '../shared/events';
import {
  compilationBegun,
  CODE_COMPILED,
  BEGIN_COMPILATION_IN_CLOUD,
} from '../shared/messages';

/**
 * Compiles code in the cloud and saves artifacts
 * in the same directory which contains sketch.
 *
 * :: FQBN -> String -> Path -> Promise Path Error
 */
const compileAndSaveBinaryInCloud = (fqbn, code, sketchPath) => {
  const pioId = xd.getPioBoardId(fqbn);
  const sketchDir = path.dirname(sketchPath);
  const sketchNameWithoutExt = R.replace(
    path.extname(sketchPath),
    '',
    path.basename(sketchPath)
  );

  return xd
    .compile(pioId, code)
    .then(xd.saveCompiledBinary(sketchDir))
    .then(filePath => {
      const fqbnToFilename = R.replace(/:/g, '.', fqbn);
      const fileExt = path.extname(filePath);
      const newFilename = `${sketchNameWithoutExt}.${fqbnToFilename}${fileExt}`;
      const newPath = path.resolve(sketchDir, newFilename);
      return fse.rename(filePath, newPath).then(R.always(newPath));
    });
};

const uploadThroughCloud = async (onProgress, cli, payload) => {
  onProgress({
    percentage: 0,
    message: compilationBegun(payload.board.name),
    tab: 'compiler',
  });
  const { sketchName, sketchPath } = await xdb.saveSketch(cli, payload.code);
  onProgress({
    percentage: 10,
    message: BEGIN_COMPILATION_IN_CLOUD,
    tab: 'compiler',
  });
  if (!xd.canCompile(payload.board.fqbn)) {
    return Promise.reject(
      createError('CLOUD_COMPILE_UNSPUPPORTED', {
        boardName: payload.board.name,
      })
    );
  }
  await compileAndSaveBinaryInCloud(
    payload.board.fqbn,
    payload.code,
    sketchPath
  );
  onProgress({
    percentage: 40,
    message: CODE_COMPILED,
    tab: 'compiler',
  });
  const uploadLog = await cli
    .upload(
      stdout =>
        onProgress({
          percentage: 60,
          message: stdout,
          tab: 'uploader',
        }),
      payload.port.comName,
      payload.board.fqbn,
      sketchName,
      true
    )
    .catch(xdb.wrapUploadError);
  onProgress({
    percentage: 100,
    message: '',
    tab: 'uploader',
  });

  return uploadLog;
};

/**
 * Begins upload pipeline.
 * It have a branch:
 * - if `payload.cloud` is `true` it will upload through cloud
 * - otherwise it will upload through USB
 *
 * Returns Promise with an upload log. TODO: Is it right?
 *
 * :: (Object -> _) -> ArduinoCli -> UploadPayload -> Promise String Error
 */
export const upload = (onProgress, cli, payload) => {
  const uploadFn = payload.cloud ? uploadThroughCloud : xdb.uploadThroughUSB;
  const payloadWithUpdatedFqbn = R.over(
    R.lensProp('board'),
    xdb.patchFqbnWithOptions,
    payload
  );
  return uploadFn(onProgress, cli, payloadWithUpdatedFqbn);
};

// =============================================================================
//
// Subscribers
//
// =============================================================================
export const subscribeListBoards = cli =>
  subscribeIpc(
    () => loadWorkspacePath().then(ws => xdb.listBoards(ws, cli)),
    LIST_BOARDS
  );

export const subscribeUpload = cli =>
  subscribeIpc(
    (_, payload, onProgress) => upload(onProgress, cli, payload),
    UPLOAD_TO_ARDUINO
  );

export const subscribeUpdateIndexes = cli =>
  subscribeIpc(
    () => loadWorkspacePath().then(ws => xdb.updateIndexes(ws, cli)),
    UPDATE_INDEXES
  );

export const subscribeCheckUpdates = cli =>
  subscribeIpc(() => xdb.checkUpdates(cli), CHECK_ARDUINO_DEPENDENCY_UPDATES);

export const subscribeUpgradeArduinoPackages = cli =>
  subscribeIpc(
    (_, _2, onProgress) => xdb.upgradeArduinoPackages(onProgress, cli),
    UPGRADE_ARDUINO_DEPENDECIES
  );
