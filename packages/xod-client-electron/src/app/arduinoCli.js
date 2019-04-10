import * as R from 'ramda';
import * as xdb from 'xod-deploy-bin';

import subscribeIpc from './subscribeIpc';
import { loadWorkspacePath } from './workspaceActions';
import {
  LIST_BOARDS,
  UPLOAD_TO_ARDUINO,
  UPDATE_INDEXES,
  CHECK_ARDUINO_DEPENDENCY_UPDATES,
  UPGRADE_ARDUINO_DEPENDECIES,
} from '../shared/events';

/**
 * Begins upload through USB pipeline.
 *
 * Returns Promise with an upload log. TODO: Is it right?
 *
 * :: (Object -> _) -> ArduinoCli -> UploadPayload -> Promise String Error
 */
export const upload = (onProgress, cli, payload) => {
  const payloadWithUpdatedFqbn = R.over(
    R.lensProp('board'),
    xdb.patchFqbnWithOptions,
    payload
  );
  return xdb.uploadThroughUSB(onProgress, cli, payloadWithUpdatedFqbn);
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
