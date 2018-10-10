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
import {
  CHECK_ARDUINO_DEPENDENCIES_INSTALLED,
  INSTALL_ARDUINO_DEPENDENCIES,
} from '../shared/events';
import promisifyIpc from '../view/promisifyIpc';

// =============================================================================
//
// Local types & constants
//
// =============================================================================

// ArduinoDependencies :: { libraries: [URL] }
// ArduinoDependencyPaths :: { libraries: String }

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
