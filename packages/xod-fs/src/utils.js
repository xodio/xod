import R from 'ramda';
import fs from 'fs';
import path from 'path';
import expandHomeDir from 'expand-home-dir';

// :: string -> boolean
export const isDirectoryExists = R.compose(
  R.invoker(0, 'isDirectory'),
  fs.statSync,
  path.resolve,
  expandHomeDir
);
