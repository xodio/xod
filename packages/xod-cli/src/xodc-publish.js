import path from 'path';
import R from 'ramda';
import * as xodFs from 'xod-fs';
import * as messages from './messages';
import { getClient, stringifyError, stringifyValue, URL } from './swagger';

function getPublication(author, owner, projectDir) {
  return Promise
    .all([
      xodFs.findClosestProjectDir(projectDir),
      xodFs.findClosestWorkspaceDir(projectDir),
    ])
    .then(([closestProjectDir, closestWorkspaceDir]) =>
      xodFs.loadProjectWithoutLibs(closestProjectDir, closestWorkspaceDir)
    )
    .then(xodFs.pack)
    .then((content) => {
      const xodFile = path.resolve(projectDir, 'project.xod');
      if (!content.meta) {
        return Promise.reject(
          `could not find "meta" in "${xodFile}".`);
      }
      if (!content.meta.name) {
        return Promise.reject(
          `could not find "meta.name" in "${xodFile}".`);
      }
      if (!content.meta.version) {
        return Promise.reject(
          `could not find "meta.version" in "${xodFile}".`);
      }
      return {
        libVersion: { author, content },
        owner,
        semver: content.meta.version,
        slug: content.meta.name,
      };
    });
}

export default function publish(author, owner, projectDir) {
  return Promise
    .all([
      getClient(URL),
      getPublication(author, owner, projectDir),
    ])
    .then(([client, publication]) =>
      client.Library.publishLibrary(publication)
            .catch(error => Promise.reject(stringifyError(error)))
    )
    .then(R.compose(
      stringifyValue,
      R.assocPath(['obj', 'content'], '<CONTENT>')
    ))
    .then(messages.success)
    .catch((error) => {
      messages.error(error);
      process.exit(1);
    });
}
