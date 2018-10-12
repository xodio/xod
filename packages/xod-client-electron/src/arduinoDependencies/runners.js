/**
 * Module for the renderer process
 * related to checking and installing Arduino dependencies:
 * - libraries
 * - packages
 *
 * It encapsulates all IPC communication between the renderer process
 * and the main process and returns `Promise`s.
 */

import * as R from 'ramda';
import { noop } from 'xod-func-tools';
import {
  CHECK_ARDUINO_DEPENDENCIES_INSTALLED,
  INSTALL_ARDUINO_DEPENDENCIES,
  CHECK_ARDUINO_DEPENDENCY_UPDATES,
  UPGRADE_ARDUINO_DEPENDECIES,
} from '../shared/events';
import promisifyIpc from '../view/promisifyIpc';

// =============================================================================
//
// Local types & constants
//
// =============================================================================

// ArduinoDependencies :: { libraries: [URL] }
// ArduinoDependencyPaths :: { libraries: String }
// Core :: { ID: String, Name: String, Installed: String, Latest: String }

// =============================================================================
//
// API
//
// =============================================================================

// :: (ProgressData -> _) -> ArduinoDependencies -> Promise ArduinoDependencies Error
export const checkArduinoDependencies = R.curry((onProgress, deps) =>
  promisifyIpc(CHECK_ARDUINO_DEPENDENCIES_INSTALLED)(onProgress, deps)
);

// :: (ProgressData -> _) -> ArduinoDependencies -> Promise ArduinoDependencies Error
export const installArduinoDependencies = R.curry((onProgress, deps) =>
  promisifyIpc(INSTALL_ARDUINO_DEPENDENCIES)(onProgress, deps)
);

// :: _ -> Promise [Core] Error
export const checkArduinoDependencyUpdates = () =>
  promisifyIpc(CHECK_ARDUINO_DEPENDENCY_UPDATES)(noop, null);

// :: _ -> Promise [Core] Error
export const updateArduinoPackages = onProgress =>
  promisifyIpc(UPGRADE_ARDUINO_DEPENDECIES)(onProgress, null);
