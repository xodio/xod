import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { resolvePath } from 'xod-fs';
import { maybeToPromise } from 'xod-func-tools';
import isDevelopment from 'electron-is-dev';

export const IS_DEV = (isDevelopment || process.env.NODE_ENV === 'development');

// for IPC. see https://electron.atom.io/docs/api/remote/#remote-objects
// if we don't do this, we get empty objects on the other side instead of errors
export const errorToPlainObject = R.when(
  R.is(Error),
  R.converge(R.pick, [
    Object.getOwnPropertyNames,
    R.identity,
  ])
);

/**
 * It provides one iterface for getting file path, that
 * should be opened on start-up (if User opens associated file),
 * on any platform:
 * - Windows & Linux: get it from process.argv
 * - MacOS: get it from fired events
 *
 * It accepts an app and returns a getter function,
 * that will return `Promise Path Null`.
 */
// :: App -> (_ -> Promise Path Null)
export const getFilePathToOpen = (app) => {
  // Windows & Linux
  let pathToOpen = R.compose(
    R.map(resolvePath),
    Maybe,
    R.ifElse(
      () => isDevelopment,
      R.nth(2), // electron . /optional/path/to/project.xod
      R.nth(1) // xod.app /optional/path/to/project.xod
    )
  )(process.argv);

  // MacOS
  app.on('will-finish-launching', () => {
    app.on('open-file', (event, filePath) => {
      pathToOpen = Maybe(filePath);
    });
  });

  return () => maybeToPromise(
    R.always(null),
    R.identity,
    pathToOpen
  );
};
