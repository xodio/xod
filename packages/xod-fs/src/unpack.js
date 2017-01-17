import R from 'ramda';
import path from 'path';
import { notNil, hasNot, localID, isLocalID } from 'xod-core';

// :: "./awesome_project/" -> "main" -> "patch.xodm" -> "./awesome_project/main/patch.xodm"
const filePath = (projectPath, patchPath, fileName) => R.pipe(
  R.concat(R.defaultTo('', patchPath)),
  R.concat(projectPath)
)(fileName);

// :: "Awesome name" -> "awesome_name"
export const fsSafeName = R.pipe(
  R.replace(/[^a-z0-9]/gi, '_'),
  R.toLower
);

// :: folders -> folder -> path -> "parent_folder/child_folder/"
const getParentFoldersPath = (folders, folder, accPath) => {
  const newPath = R.prepend(
    fsSafeName(folder.name),
    accPath
  );

  if (R.isNil(folder.parentId)) {
    return R.pipe(
      R.append(''),
      R.join(path.sep)
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

// :: xodball -> [ libName, ... ]
const extractLibs = R.pipe(
  R.prop('nodeTypes'),
  R.values,
  R.reject(R.pipe(
    R.prop('id'),
    isLocalID
  )),
  R.map(
    R.pipe(
      R.prop('id'),
      R.split(path.sep),
      R.init,
      R.join(path.sep)
    )
  ),
  R.reject(R.isEmpty),
  R.uniq
);

// :: patchMeta -> xodball -> patchNodeMeta
const margeWithNodeType = (obj, patchId, xodball) => {
  if (hasNot(patchId, xodball.nodeTypes)) { return obj; }

  return R.pipe(
    R.path(['nodeTypes', patchId]),
    R.flip(R.merge)(obj),
    R.omit(['id'])
  )(xodball);
};

// :: xodball -> { meta, libs }
export const extractProject = xodball => ({
  meta: R.omit(['id'], xodball.meta),
  libs: extractLibs(xodball),
});

// :: xodball -> "./project_name_lowercased/"
export const getProjectPath = R.pipe(
  R.path(['meta', 'name']),
  fsSafeName,
  R.flip(R.concat)(path.sep),
  R.concat(`.${path.sep}`)
);

// :: patch -> folders -> "folder_name/patch_name_lowercased/"
export const getPatchPath = R.curry((patch, xodball) => {
  const folders = foldersPaths(xodball);
  const folderPath = R.propOr('', patch.folderId, folders);
  const patchName = fsSafeName(patch.label);
  return `${folderPath}${patchName}/`;
});

// This function will remove ids from patches,
// but if any node references to patch (this is patchNode),
// so we'll replace this id with path, like '@/foldersPath/patchName'
// :: patches -> patchesWithResolvedIds
const resolvePatchIds = (patches) => {
  const pathMapping = R.reduce(
    (acc, patch) => {
      if (isLocalID(patch.id) === false) { return acc; }
      return R.assoc(patch.id, localID(patch.path), acc);
    },
    {},
    patches
  );

  const filterLocalPatches = R.filter(
    R.pipe(
      R.prop('id'),
      R.has(R.__, pathMapping)
    )
  );

  const resolveNode = (node) => {
    const typeId = node.typeId;
    if (hasNot(typeId, pathMapping)) { return node; }
    return R.assoc('typeId', pathMapping[typeId], node);
  };

  // :: patch -> patchWithResolvedNodes
  const resolvePatches = R.evolve({
    patch: {
      nodes: R.pipe(
        R.values,
        R.map(resolveNode),
        R.indexBy(R.prop('id'))
      ),
    },
  });

  return R.pipe(
    filterLocalPatches,
    R.map(resolvePatches),
    R.map(R.omit(['id']))
  )(patches);
};

// :: xodball -> [ patch: { path, meta, patch } ]
export const extractPatches = xodball => R.pipe(
  R.prop('patches'),
  R.values,
  R.filter(
    R.pipe(
      R.prop('id'),
      isLocalID
    )
  ),
  R.map(
    patch => ({
      id: patch.id,
      path: getPatchPath(patch, xodball),
      meta: margeWithNodeType({
        label: patch.label,
      }, patch.id, xodball),
      patch: {
        nodes: patch.nodes,
        links: patch.links,
      },
    })
  ),
  resolvePatchIds
)(xodball);

// :: xodball -> extractedObject
const extract = xodball => ({
  project: extractProject(xodball),
  patches: extractPatches(xodball),
});

// :: xodball -> extractedObjectGroupedByPaths
export const arrangeByFiles = (xodball) => {
  const data = extract(xodball);
  const projectPath = getProjectPath(xodball);
  const result = [{
    path: filePath(projectPath, null, 'project.xod'),
    content: data.project,
  }];

  return R.pipe(
    R.reduce(
      (acc, patch) => R.concat(acc,
        [
          {
            // id: patch.meta.id,
            path: filePath(projectPath, patch.path, 'patch.xodm'),
            content: patch.meta,
          },
          {
            // id: patch.meta.id,
            path: filePath(projectPath, patch.path, 'patch.xodp'),
            content: patch.patch,
          },
        ]
      ),
      []
    ),
    R.concat(result)
  )(data.patches);
};
