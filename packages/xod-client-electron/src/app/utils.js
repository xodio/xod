import R from 'ramda';

// for IPC. see https://electron.atom.io/docs/api/remote/#remote-objects
// if we don't do this, we get empty objects on the other side instead of errors
export const errorToPlainObject = R.when(
  R.is(Error),
  R.converge(R.pick, [
    Object.getOwnPropertyNames,
    R.identity,
  ])
);

export default {};
