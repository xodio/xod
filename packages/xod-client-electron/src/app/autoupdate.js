import R from 'ramda';
import { errorToPlainObject } from './utils';
import {
  APP_UPDATE_AVAILABLE,
  APP_UPDATE_PROGRESS,
  APP_UPDATE_DOWNLOADED,
  APP_UPDATE_ERROR,
  APP_UPDATE_DOWNLOAD_REQUEST,
  APP_UPDATE_DOWNLOAD_STARTED,
} from '../shared/events';

// =============================================================================
//
// Configuring of autoUpdater
//
// =============================================================================

// :: autoUpdater -> logger -> autoUpdater
export const configureAutoUpdater = (autoUpdater, logger) => {
  /* eslint-disable no-param-reassign */
  autoUpdater.autoDownload = false;

  autoUpdater.logger = logger;
  autoUpdater.logger.transports.file.level = 'info';
  autoUpdater.logger.transports.console.level = 'info';
  /* eslint-enable no-param-reassign */

  return autoUpdater;
};

// =============================================================================
//
// Subscriptions on autoUpdater events
//
// =============================================================================

// :: (Info -> ()) -> autoUpdater -> autoUpdater
const subscribeOnUpdateAvailable = R.curry(
  (callback, autoUpdater) => autoUpdater.on('update-available', callback)
);

// :: (ProgressObj -> ()) -> autoUpdater -> autoUpdater
const subscribeOnUpdateProgress = R.curry(
  (callback, autoUpdater) => autoUpdater.on('download-progress', callback)
);

// :: (Error -> ()) -> autoUpdater -> autoUpdater
const subscribeOnUpdateError = R.curry(
  (callback, autoUpdater) => autoUpdater.on('error', err => callback(errorToPlainObject(err)))
);

// :: (Info -> ()) -> autoUpdater -> autoUpdater
const subscribeOnUpdateDownloaded = R.curry(
  (callback, autoUpdater) => autoUpdater.on('update-downloaded', (info) => {
    callback(info);
    autoUpdater.quitAndInstall();
  })
);

// :: (() -> ()) -> ipcMain -> autoUpdater -> autoUpdater
const subscribeOnUpdateRequested = R.curry(
  (callback, ipcMain, autoUpdater) => {
    ipcMain.on(APP_UPDATE_DOWNLOAD_REQUEST, () => {
      autoUpdater.downloadUpdate();
      callback();
    });
    return autoUpdater;
  }
);

// :: (Srting -> Any -> ()) -> autoUpdater -> autoUpdater
export const subscribeOnAutoUpdaterEvents = (send, ipcMain, autoUpdater) => R.compose(
  subscribeOnUpdateRequested(() => send(APP_UPDATE_DOWNLOAD_STARTED), ipcMain),
  subscribeOnUpdateError(err => send(APP_UPDATE_ERROR, err)),
  subscribeOnUpdateAvailable(info => send(APP_UPDATE_AVAILABLE, info)),
  subscribeOnUpdateProgress(progressObj => send(APP_UPDATE_PROGRESS, progressObj)),
  subscribeOnUpdateDownloaded(info => send(APP_UPDATE_DOWNLOADED, info))
)(autoUpdater);
