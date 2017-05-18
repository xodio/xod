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
export const doesDirectoryExist = R.tryCatch(
  R.compose(
    R.invoker(0, 'isDirectory'),
    fs.statSync,
    resolvePath
  ),
  R.F
);

// :: string -> boolean
export const doesFileExist = R.tryCatch(
  R.compose(
    R.invoker(0, 'isFile'),
    fs.statSync,
    resolvePath
  ),
  R.F
);

const indexByIds = R.indexBy(R.prop('id'));

export const reassignIds = R.evolve({
  nodes: indexByIds,
  links: indexByIds,
});

export const getPatchName = (patchPath) => {
  const parts = patchPath.split(path.sep);
  return parts[parts.length - 2];
};

export const hasExt = R.curry((ext, filename) => R.equals(path.extname(filename), ext));
