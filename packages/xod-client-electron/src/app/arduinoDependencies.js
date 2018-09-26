/**
 * Module for the main process
 * related to checking and installing Arduino dependencies:
 * - libraries
 * - packages
 *
 * It encapsulates all IPC communication between the main process
 * and the renderer process and checks/installs dependencies.
 */

import * as R from 'ramda';
import path from 'path';
import {
  checkLibrariesInstalledByUrls,
  installLibrariesByUrls,
} from 'xod-deploy';

import {
  CHECK_ARDUINO_DEPENDENCIES_INSTALLED,
  INSTALL_ARDUINO_DEPENDENCIES,
} from '../shared/events';
import subscribeIpc from './subscribeIpc';
import { getPathToBundledWorkspace } from './utils';
import { ARDUINO_LIBRARIES_DIRNAME } from './constants';
import { loadWorkspacePath } from './workspaceActions';

export const getArdulibsPath = p => path.resolve(p, ARDUINO_LIBRARIES_DIRNAME);
export const getBundledArdulibsPath = () =>
  getArdulibsPath(getPathToBundledWorkspace());

// :: ArduinoCli -> [{ package, packageName }] -> Promise [{ package, packageName, installed }] Error
const checkArduinoPackageInstalled = async (cli, packages) => {
  const installedIds = await R.pipeP(cli.core.list, R.pluck('ID'))();
  return R.map(
    R.ifElse(
      R.pipe(R.prop('package'), R.contains(R.__, installedIds)),
      R.assoc('installed', true),
      R.assoc('installed', false)
    )
  )(packages);
};

// :: (ProgressData -> _) -> ArduinoCli -> [{ package, packageName }] -> Promise [{ package, packageName, installed }] Error
const installArduinoPackages = async (onProgress, cli, packages) =>
  Promise.all(
    R.map(pkg => cli.core.install(onProgress, pkg.package))(packages)
  ).then(() => R.map(R.assoc('installed', true))(packages));

export const subscribeOnCheckArduinoDependencies = arduinoCli =>
  subscribeIpc(
    (_, deps, onProgress) =>
      loadWorkspacePath()
        .then(wsPath => path.resolve(wsPath, ARDUINO_LIBRARIES_DIRNAME))
        .then(libsPath =>
          Promise.all([
            checkLibrariesInstalledByUrls(onProgress, libsPath, deps.libraries),
            checkArduinoPackageInstalled(arduinoCli, deps.packages),
          ])
        )
        .then(([libraries, packages]) => ({ libraries, packages })),
    CHECK_ARDUINO_DEPENDENCIES_INSTALLED
  );

export const subscribeOnInstallArduinoDependencies = arduinoCli =>
  subscribeIpc(
    (_, deps, onProgress) =>
      loadWorkspacePath()
        .then(wsPath => path.resolve(wsPath, ARDUINO_LIBRARIES_DIRNAME))
        .then(libsPath =>
          Promise.all([
            installLibrariesByUrls(onProgress, libsPath, deps.libraries),
            installArduinoPackages(onProgress, arduinoCli, deps.packages),
          ])
        )
        .then(([libraries, packages]) => ({ libraries, packages })),
    INSTALL_ARDUINO_DEPENDENCIES
  );
