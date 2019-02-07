import path from 'path';
import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { resolvePath } from 'xod-fs';
import isDevelopment from 'electron-is-dev';

export const IS_DEV = isDevelopment || process.env.NODE_ENV === 'development';

// for IPC. see https://electron.atom.io/docs/api/remote/#remote-objects
// if we don't do this, we get empty objects on the other side instead of errors
export const errorToPlainObject = R.when(
  R.is(Error),
  R.converge(R.pick, [Object.getOwnPropertyNames, R.identity])
);

/**
 * It provides one iterface for getting file path, that
 * should be opened on start-up (if User opens associated file),
 * on any platform:
 * - Windows & Linux: get it from process.argv
 * - MacOS: get it from fired events
 *
 * It accepts an app and returns a getter function,
 * that will return `Maybe Path`.
 */
// :: App -> () -> Maybe Path
export const getFilePathToOpen = app => {
  // Windows & Linux
  let pathToOpen = R.compose(
    R.map(resolvePath),
    R.ifElse(
      R.anyPass([
        R.isNil,
        // to filter out command line switches and other arguments
        // that are definitely not a file path to open
        R.startsWith('-'),
        R.startsWith('data:'),
        R.equals('.'),
      ]),
      Maybe.Nothing,
      Maybe.of
    ),
    R.last,
    R.tail
  )(process.argv);

  // MacOS
  app.once('will-finish-launching', () => {
    app.once('open-file', (event, filePath) => {
      pathToOpen = Maybe(filePath);
    });
  });

  return () => pathToOpen;
};

/**
 * Returns Path to the resources directory root.
 *
 * When IDE runs in development mode it resolves to directory
 * with transpiled code, and it handles call either from Main Process
 * and Renderer Process. They're have a different `__dirname` values:
 * - Main Process: /some/path/to/src-babel/app
 * - Renderer Process: /some/path/to/src-babel
 *
 * When IDE runs in production mode it resolves to resources path.
 */
export const getResourcesRoot = () => {
  if (IS_DEV) {
    return process.type === 'renderer'
      ? __dirname
      : path.resolve(__dirname, '..');
  }
  return process.resourcesPath;
};

/**
 * Returns Path to the bundled workspace
 */
export const getPathToBundledWorkspace = () =>
  path.join(getResourcesRoot(), 'workspace');
