/**
 * Module for the renderer process
 * related to checking and installing Arduino dependencies:
 * - libraries
 * - toolchains (TODO #1201)
 * - arduino packages (TODO #1201)
 *
 * It encapsulates all IPC communication between the renderer process
 * and the main process and returns `Promise`s.
 */

import * as R from 'ramda';
import { CHECK_ARDULIBS_INSTALLED, INSTALL_ARDULIBS } from '../shared/events';
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
  promisifyIpc(CHECK_ARDULIBS_INSTALLED)(onProgress, deps)
);

// :: (ProgressData -> _) -> ArduinoDependencies -> Promise ArduinoDependencies Error
export const installArduinoDependencies = R.curry((onProgress, deps) =>
  promisifyIpc(INSTALL_ARDULIBS)(onProgress, deps)
);
