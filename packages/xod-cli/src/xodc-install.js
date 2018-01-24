import * as R from 'ramda';
import * as xodFs from 'xod-fs';
import { fetchLibData, fetchLibsWithDependencies } from 'xod-pm';
import * as messages from './messageUtils';
import * as MSG from './messages';
import { getWorkspacePath } from './utils';

// :: Path -> Promise Path Error
const ensureWorkspacePath = wsPath => new Promise((resolve, reject) => {
  if (xodFs.isWorkspaceDir(wsPath)) return resolve(wsPath);
  return reject(
    new Error(`Directory "${wsPath}" is not a workspace directory. Workspace directory must contain ".xodworkspace" file.`)
  );
});

/**
 * Installs the library version from package manager.
 * @param {LibUri} libQuery - Library identifier in the package manager (`owner/name@version`).
 * @param {Path} workspace - Path to workspace, where should be library installed
 * @return {Promise.<void>}
 */
export default function install(swaggerUrl, libQuery, workspace) {
  const wsPath = getWorkspacePath(workspace);
  return ensureWorkspacePath(wsPath)
    .then(() => fetchLibData(swaggerUrl, libQuery))
    .then(
      libData => xodFs.scanWorkspaceForLibNames(wsPath)
        .then(libNames => [libData, libNames])
    )
    .then(([libData, libNames]) => {
      messages.notice(MSG.libraryFoundAndInstalling(libQuery));

      const params = libData.requestParams;
      const libName = `${params.owner}/${params.name}`;

      return fetchLibsWithDependencies(swaggerUrl, libNames, [libName])
        .then(R.tap(R.forEachObjIndexed(
          (proj, name) => messages.notice(MSG.dependencyResolved(name))
        )))
        .then(xodFs.saveAllLibrariesEntirely(wsPath))
        .then(() => MSG.allLibrariesInstalled(wsPath));
    })
    .then(messages.success)
    .catch((err) => {
      messages.error(err.message);
      process.exit(1);
    });
}
