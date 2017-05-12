import R from 'ramda';
import fs from 'fs';
import path from 'path';
import expandHomeDir from 'expand-home-dir';

// :: string -> string
export const resolvePath = R.compose(
  path.resolve,
  expandHomeDir
);

// :: string -> boolean
export const isDirectoryExists = R.tryCatch(
  R.compose(
    R.invoker(0, 'isDirectory'),
    fs.statSync,
    resolvePath
  ),
  R.F
);

// :: string -> boolean
export const isFileExists = R.tryCatch(
  R.compose(
    R.invoker(0, 'isFile'),
    fs.statSync,
    resolvePath
  ),
  R.F
);


// TODO: remove rudimental utilities
const removeTrailingSlash = text => text.replace(/\/$/, '');
export const localID = sid => `@/${removeTrailingSlash(sid)}`;
export const isLocalID = id => (typeof id === 'string' && id[0] === '@');
