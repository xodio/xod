import R from 'ramda';
import { notNil } from './ramda';


const getParentFoldersPath = (folders, folder, path) => {
  const newPath = R.prepend(
    R.toLower(folder.name),
    path
  );

  if (R.isNil(folder.parentId)) {
    return R.pipe(
      R.prepend('.'),
      R.append(''),
      R.join('/')
    )(newPath);
  }

  const parent = R.find(R.propEq('id', folder.parentId), folders);
  return getParentFoldersPath(folders, parent, newPath);
};

// :: xodball -> [ folder, ... ]
const foldersPaths = R.pipe(
  R.prop('folders'),
  R.values,
  R.sort(
    R.allPass([
      notNil,
      R.gte,
    ])
  ),
  foldersArray => R.reduce(
    (acc, folder) => R.assoc(
      folder.id,
      getParentFoldersPath(foldersArray, folder, []),
      acc
    ),
    {}
  )(foldersArray)
);

// :: patch -> folders -> pathString
const patchPath = R.curry((patch, folders) => {
  const folderPath = R.propOr('./', patch.folderId, folders);
  const patchName = R.toLower(patch.name);
  return `${folderPath}${patchName}/`;
});

// :: xodball -> [ libName, ... ]
const extractLibs = R.pipe(
  R.prop('nodeTypes'),
  R.values,
  R.map(
    R.pipe(
      R.prop('key'),
      R.split('/'),
      R.init,
      R.join('/')
    )
  ),
  R.uniq
);

// :: xodball -> { meta, libs }
export const project = xodball => ({
  meta: R.omit(['id'], xodball.meta),
  libs: extractLibs(xodball),
});

// :: xodball -> [ patch: { path, meta, patch } ]
export const patches = xodball => R.pipe(
  R.prop('patches'),
  R.values(),
  R.map(
    patch => ({
      path: patchPath(patch, foldersPaths(xodball)),
      meta: {
        name: patch.name,
      },
      patch: {
        nodes: patch.nodes,
        links: patch.links,
      },
    })
  )
)(xodball);

// :: xodball -> extractedObject
export const all = xodball => ({
  project: project(xodball),
  patches: patches(xodball),
});

export default {
  all,
  project,
  patches,
};
