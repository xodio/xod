/**
 * This module moves old packages stored in the UserData directory into the
 * Users workspace. It provides User to keep using XOD IDE without reinstalling
 * packages, which he already installs earlier.
 *
 * Also, it removes stale empty packages directory in the UserData directory and
 * removes old tools, that was used for upload compiled in the cloud code.
 */

import path from 'path';
import * as R from 'ramda';
import * as fse from 'fs-extra';
import { app } from 'electron';

import { loadWorkspacePath } from './workspaceActions';
import { ARDUINO_PACKAGES_DIRNAME } from './constants';

const OLD_PACKAGE_VERSIONS = {
  avr: '1.6.19',
  sam: '1.6.11',
  samd: '1.6.15',
};

const moveWithoutEexistError = (from, to) =>
  fse.move(from, to).catch(err => {
    if (err.code === 'EEXIST') {
      return 0;
    }
    throw err;
  });

/**
 * Moves old packages into Users' workspace.
 *
 * :: _ -> Promise 0 Error
 */
export default async () => {
  const appData = app.getPath('userData');
  const oldPackagesDir = path.join(appData, 'packages');
  if (!await fse.pathExists(oldPackagesDir)) return 0;

  const oldHardwareDir = path.join(oldPackagesDir, 'arduino', 'hardware');
  const archs = await fse.readdir(oldHardwareDir);

  const wsPath = await loadWorkspacePath();
  const wsPackagesDir = path.join(wsPath, ARDUINO_PACKAGES_DIRNAME, 'packages');
  const wsHardwareDir = path.join(wsPackagesDir, 'arduino', 'hardware');

  // Move architectures
  await Promise.all(
    R.reduce(
      (acc, archDir) => {
        const version = OLD_PACKAGE_VERSIONS[archDir];
        if (!version) return acc;

        const from = path.join(oldHardwareDir, archDir);
        const to = path.join(wsHardwareDir, archDir, version);
        return R.append(moveWithoutEexistError(from, to), acc);
      },
      [],
      archs
    )
  );

  // Move tools
  const oldToolsDir = path.join(appData, 'packages', 'arduino', 'tools');
  const wsToolsDir = path.join(wsPackagesDir, 'arduino', 'tools');
  const tools = await fse.readdir(oldToolsDir);
  await Promise.all(
    R.reduce(
      (acc, toolDir) => {
        const from = path.join(oldToolsDir, toolDir);
        const to = path.join(wsToolsDir, toolDir);
        return R.append(moveWithoutEexistError(from, to), acc);
      },
      [],
      tools
    )
  );

  // Remove stale empty dirs
  await fse.remove(oldPackagesDir);
  // Remove stale tools for old cloud compilation:
  await fse.remove(path.join(appData, 'tools'));

  return 0;
};
