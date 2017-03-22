import Swagger from 'swagger-client';
import * as xodFs from 'xod-fs';
import * as messages from './messages';

/**
 * For every line in this string strip a leading prefix consisting of blanks
 * or control characters followed by `|` from the line.
 * @param string String with a leading prefix.
 * @see {@link http://www.scala-lang.org/api/2.5.0/scala/runtime/RichString.html#stripMargin}
 * @see {@link https://www.safaribooksonline.com/library/view/scala-cookbook/9781449340292/ch01s03.html}
 */
function stripMargin(string) {
  return string.trim().replace(/^(.*?\|)/mg, '');
}

function stringifySwaggerValue(value) {
  const text = JSON.stringify(value.obj, null, 2);
  return `${value.status} ${text}`;
}

function stringifySwaggerError(error) {
  const text = JSON.stringify(JSON.parse(error.response.text), null, 2);
  return `${error.status} ${text}`;
}

const SWAGGER_URL = 'http://localhost:10010/swagger';

function getPublication(author, owner, message, projectDir) {
  const closestProjectDir = xodFs.findClosestProjectDir(projectDir);
  const closestWorkspaceDir = xodFs.findClosestWorkspaceDir(projectDir);
  if (!closestProjectDir) {
    return Promise.reject(stripMargin(`
      |could not find project directory around "${projectDir}".
    `));
  }
  if (!closestWorkspaceDir) {
    return Promise.reject(stripMargin(`
      |could not find workspace directory around "${projectDir}".
    `));
  }
  return xodFs.loadProjectWithoutLibs(closestProjectDir, closestWorkspaceDir)
              .then(xodFs.pack)
              .then(content => ({
                libVersion: { author, content, message },
                owner,
                semver: content.meta.version,
                slug: content.meta.name,
              }));
}

export default function publish(author, owner, message, projectDir) {
  return new Swagger({ url: SWAGGER_URL, usePromise: true })
    .catch(() => Promise.reject(stripMargin(`
      |could not find swagger file at "${SWAGGER_URL}".
    `)))
    .then(client =>
      getPublication(author, owner, message, projectDir)
        .then(client.Library.publishLibrary)
        .then((value) => {
          // eslint-disable-next-line no-param-reassign
          value.obj.content = '<CONTENT>';
          return stringifySwaggerValue(value);
        })
        .catch(error => Promise.reject(stringifySwaggerError(error.errObj)))
    )
    .then(messages.success)
    .catch((error) => {
      messages.error(error);
      process.exit(1);
    });
}
