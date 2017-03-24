import fs from 'fs';
import path from 'path';
import R from 'ramda';
import * as xodFs from 'xod-fs';
import * as messages from './messages';
import { getClient, stringifyError, URL } from './swagger';
import LibrarySymbol from './types';

function getLibrary(client, librarySymbol) {
  const { owner, slug, semver } = librarySymbol;
  return client
    .Library.readLibraryBySymbol({ owner, slug })
    .then(R.path(['obj', 'id']))
    .then(semver
      ? id => client.LibVersion.readLibVersion({ id, semver })
      : id => client.LibVersion.readLibVersionHead({ id })
    )
    .then(R.path(['obj', 'content']))
    .catch(error => Promise.reject(error.status === 404
      ? `could not find library "${librarySymbol}".`
      : stringifyError(error)
    ));
}

function checkLibraryDirConflict(libraryDir, librarySymbol) {
  return new Promise((resolve, reject) => {
    fs.lstat(libraryDir, (error, stat) => {
      if (!error && stat.isDirectory()) {
        return reject(
          `could not install "${librarySymbol}". "${libraryDir}" is not empty, remove it manually.`
        );
      }
      return resolve();
    });
  });
}

export default function install(library, path$) {
  return Promise
    .all([
      LibrarySymbol.parsePromise(library),
      getClient(URL),
      xodFs.findClosestWorkspaceDir(path$),
    ])
    .then(([librarySymbol, client, workspaceDir]) => {
      const { owner, slug } = librarySymbol;
      const ownerDir = path.resolve(workspaceDir, 'lib', owner);
      const libraryDir = path.resolve(ownerDir, slug);
      return checkLibraryDirConflict(libraryDir, librarySymbol)
        .then(() => getLibrary(client, librarySymbol))
        .then(xodFs.arrangeByFiles)
        .then(xodFs.save(ownerDir))
        .then(() => `Installed "${librarySymbol}" at "${libraryDir}".`);
    })
    .then(messages.success)
    .catch((error) => {
      messages.error(error);
      process.exit(1);
    });
}
