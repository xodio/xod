import R from 'ramda';
import * as xodFs from 'xod-fs';
import { fetchLibData, fetchLibsWithDependencies } from 'xod-pm';
import * as messages from './messageUtils';
import * as MSG from './messages';

/**
 * Installs the library version from package manager.
 * @param {LibUri} libQuery - Library identifier in the package manager (`owner/name@version`).
 * @param {Path} distPath - Path to workspace, where should be library installed
 * @return {Promise.<void>}
 */
export default function install(swaggerUrl, libQuery, distPath) {
  return Promise.all([
    fetchLibData(swaggerUrl, libQuery),
    xodFs.findClosestWorkspaceDir(distPath),
  ])
    .then(
      ([libData, wsPath]) => xodFs.scanWorkspaceForLibNames(wsPath)
        .then(libNames => [libData, wsPath, libNames])
    )
    .then(([libData, wsPath, libNames]) => {
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
