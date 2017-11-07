import R from 'ramda';
import isDevelopment from 'electron-is-dev';

export const IS_DEV = isDevelopment || process.env.NODE_ENV === 'development';

// for IPC. see https://electron.atom.io/docs/api/remote/#remote-objects
// if we don't do this, we get empty objects on the other side instead of errors
export const errorToPlainObject = R.when(
  R.is(Error),
  R.converge(R.pick, [Object.getOwnPropertyNames, R.identity])
);
