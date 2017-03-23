import R from 'ramda';
import Swagger from 'swagger-client';
import * as xodFs from 'xod-fs';
import * as messages from './messages';

const SWAGGER_URL = 'http://localhost:10010/swagger';

function stringifySwaggerValue(value) {
  const text = JSON.stringify(value.obj, null, 2);
  return `${value.status} ${text}`;
}

function stringifySwaggerError(error) {
  if (typeof error === 'string') {
    return error;
  }
  const text = JSON.stringify(JSON.parse(error.errObj.response.text), null, 2);
  return `${error.errObj.status} ${text}`;
}

function getSwaggerClient(url) {
  return new Swagger({ url, usePromise: true }).catch(() =>
    Promise.reject(`could not find swagger file at "${url}".`)
  );
}

function getPublication(author, owner, projectDir) {
  const closestProjectDir = xodFs.findClosestProjectDir(projectDir);
  const closestWorkspaceDir = xodFs.findClosestWorkspaceDir(projectDir);
  if (!closestProjectDir) {
    return Promise.reject(
      `could not find project directory around "${projectDir}".`
    );
  }
  if (!closestWorkspaceDir) {
    return Promise.reject(
      `could not find workspace directory around "${projectDir}".`
    );
  }
  return xodFs.loadProjectWithoutLibs(closestProjectDir, closestWorkspaceDir)
              .then(xodFs.pack)
              .then(content => ({
                libVersion: { author, content },
                owner,
                semver: content.meta.version,
                slug: content.meta.name,
              }));
}

export default function publish(author, owner, projectDir) {
  return Promise
    .all([
      getSwaggerClient(SWAGGER_URL),
      getPublication(author, owner, projectDir),
    ])
    .then(([client, publication]) =>
      client.Library.publishLibrary(publication)
            .then(R.compose(
              stringifySwaggerValue,
              R.assocPath(['obj', 'content'], '<CONTENT>')
            ))
            .catch(error => Promise.reject(stringifySwaggerError(error)))
    )
    .then(messages.success)
    .catch((error) => {
      messages.error(error);
      process.exit(1);
    });
}
