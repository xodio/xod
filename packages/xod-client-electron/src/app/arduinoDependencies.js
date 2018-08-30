/**
 * Module for the main process
 * related to checking and installing Arduino dependencies:
 * - libraries
 * - toolchains (TODO #1201)
 * - arduino packages (TODO #1201)
 *
 * It encapsulates all IPC communication between the main process
 * and the renderer process and checks/installs dependencies.
 */

import path from 'path';
import {
  checkLibrariesInstalledByUrls,
  installLibrariesByUrls,
} from 'xod-arduino-deploy';

import { CHECK_ARDULIBS_INSTALLED, INSTALL_ARDULIBS } from '../shared/events';
import subscribeIpc from './subscribeIpc';

const ARDULIBS_PATH = '__ardulib__';

export const getArdulibsPath = p => path.resolve(p, ARDULIBS_PATH);

export const subscribeOnCheckArduinoLibraries = workspacePath => {
  const libsPath = path.resolve(workspacePath, ARDULIBS_PATH);
  subscribeIpc(
    (_, deps, onProgress) =>
      checkLibrariesInstalledByUrls(onProgress, libsPath, deps.libraries),
    CHECK_ARDULIBS_INSTALLED
  );
};

export const subscribeOnInstallArduinoLibraries = workspacePath => {
  const libsPath = path.resolve(workspacePath, ARDULIBS_PATH);
  subscribeIpc(
    (_, deps, onProgress) =>
      installLibrariesByUrls(onProgress, libsPath, deps.libraries),
    INSTALL_ARDULIBS
  );
};
