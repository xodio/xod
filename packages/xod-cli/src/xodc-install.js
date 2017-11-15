import * as xodFs from 'xod-fs';
import { fetchLibData, fetchLibXodball, getLibVersion } from 'xod-pm';
import * as messages from './messages';

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
    .then(([libData, wsPath]) => {
      const params = libData.requestParams;
      const libName = `${params.owner}/${params.name}`;
      const version = getLibVersion(libData);

      return fetchLibXodball(swaggerUrl, `${libName}@${version}`)
        .then(xodball => xodFs.saveProjectAsLibrary(params.owner, xodball, wsPath))
        .then(() => `Installed new library "${libQuery}" into workspace "${wsPath}".`);
    })
    .then(messages.success)
    .catch((err) => {
      messages.error(err.message);
      process.exit(1);
    });
}
