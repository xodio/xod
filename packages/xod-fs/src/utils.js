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
export const isDirectoryExists = R.compose(
  R.tryCatch(
    R.compose(
      R.invoker(0, 'isDirectory'),
      fs.statSync
    ),
    R.F
  ),
  resolvePath
);

// :: string -> boolean
export const isFileExists = R.compose(
  R.tryCatch(
    R.compose(
      R.invoker(0, 'isFile'),
      fs.statSync
    ),
    R.F
  ),
  resolvePath
);
