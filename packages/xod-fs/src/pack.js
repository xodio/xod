import R from 'ramda';
import path from 'path';
import { hasNot, generateId, localID } from 'xod-core';

const indexById = R.indexBy(R.prop('id'));

// :: "may/be/path/to/somename.of.file.ext" ->
//      fileType ("patch"|"project")
const getFileType = R.pipe(
  R.split('.'),
  (parts) => {
    switch (R.last(parts)) {
      case 'xodm':
      case 'xodp':
        return 'patch';
      case 'xod':
        return 'project';
      default:
        return '';
    }
  }
);

// :: "./project/path/to/patch/and/file.ext" -> path { type, folders }
const parsePath = R.pipe(
  R.split(path.sep),
  R.reject(R.equals('.')),
  (projectPath) => ({
    type: getFileType(R.last(projectPath)),
    folders: R.pipe(
      R.slice(1, -2),
      R.join(path.sep)
    )(projectPath),
  })
);

// :: path { type, folders } -> folders {} -> "folderId"
const findFolderId = R.curry((folderPath, folders) => {
  if (folderPath.length === 0) {
    return null;
  }

  const getNextPartId = (pathParts, parentId) => {
    if (pathParts.length === 0) {
      return parentId;
    }

    const part = R.head(pathParts);
    const id = R.pipe(
      R.values,
      R.find(
        R.allPass([
          R.propEq('name', part),
          R.propEq('parentId', parentId),
        ])
      ),
      R.prop('id')
    )(folders);

    return getNextPartId(
      R.tail(pathParts),
      id
    );
  };

  return getNextPartId(
    R.split(path.sep, folderPath),
    null
  );
});

// :: [] -> true/false
const isLengthEqualZero = R.pipe(
  R.length,
  R.equals(0)
);

// :: path './projectName/folder/patchName/somefile.xodsmth' -> '@/folder/patchName'
const getPatchIdFromPath = R.pipe(
  R.split('/'),
  R.slice(2, -1),
  R.join('/'),
  R.ifElse(
    isLengthEqualZero,
    R.always(null),
    localID
  )
);

// :: unpackedFileData { path, content } -> { path, type, folders, content }
const extractPathData = unpackedFileData => {
  const patchPath = R.prop('path', unpackedFileData);

  const patchTypeAndFolder = parsePath(patchPath);
  const extendedPatch = R.merge(unpackedFileData, patchTypeAndFolder);

  const patchId = getPatchIdFromPath(patchPath);
  const idToMerge = (patchId === null) ? {} : { id: patchId };

  return R.mergeWith(R.merge, extendedPatch, { content: idToMerge });
};

// :: unpackedData -> mergedData [ { id, type, folders, content } ]
const mergeById = R.pipe(
  R.map(extractPathData),
  R.groupBy(R.pathOr('project', ['content', 'id'])),
  R.values,
  R.map(
    R.reduce(
      (acc, data) => R.mergeWithKey(
        (k, l, r) => (k === 'content' ? R.merge(l, r) : r),
        acc,
        data
      ),
      {}
    )
  )
);

// :: mergedData -> projectMetaContent
const getProjectContents = R.pipe(
  R.find(R.propEq('type', 'project')),
  R.prop('content')
);

// :: mergedData -> projectMetaContent
const getProjectMeta = R.pipe(
  getProjectContents,
  R.prop('meta')
);

// :: patchPathArrays -> folders { { id, name, parentId }, ... }
const recursiveCreateFolders = (foldersSource) => {
  const foldersAcc = {};

  const addFolder = (name, parentId = null) => {
    const id = generateId();
    foldersAcc[id] = { id, name, parentId };

    return id;
  };

  const createFolders = (folders, parentId = null) => R.pipe(
    R.groupBy(R.prop(0)),
    R.values,
    R.forEach(
      group => {
        const name = group[0][0];
        const foldersLeft = R.map(R.tail)(group);
        const id = addFolder(name, parentId);

        if (foldersLeft[0].length > 0) {
          createFolders(foldersLeft, id);
        }
      }
    )
  )(folders);

  createFolders(foldersSource);

  return foldersAcc;
};

// :: mergedData -> folders { id, name, parentId }
const getProjectFolders = R.pipe(
  R.map(R.prop('folders')),
  R.reject(R.isEmpty),
  R.uniq,
  R.map(R.split(path.sep)),
  recursiveCreateFolders
);
// :: mergedData -> patches
const filterPatches = R.filter(R.propEq('type', 'patch'));

// :: mergedData -> folders -> patches [{ id, label, nodes, links }, ...]
const getPatches = R.curry((mergedData, folders) => R.pipe(
  filterPatches,
  R.map(
    patch => {
      const folderId = findFolderId(patch.folders, folders);

      return R.pipe(
        R.prop('content'),
        R.pick(['id', 'label', 'nodes', 'links']),
        R.merge({ nodes: {}, links: {}, folderId })
      )(patch);
    }
  ),
  indexById
)(mergedData));

// :: mergedData -> patchNodes [{ id, patchNode, label, category, properties, pins }, ...]
const getPatchNodes = R.pipe(
  filterPatches,
  R.filter(
    R.pathEq(['content', 'patchNode'], true)
  ),
  R.map(
    R.pipe(
      R.prop('content'),
      R.pick(['id', 'patchNode', 'label', 'category', 'properties', 'pins']),
      R.merge({ properties: {}, pins: {} })
    )
  ),
  indexById
);

// :: mergedData -> { ...nodeTypes, ...patchNodes }
const getNodeTypes = R.curry((mergedData, libs) => R.mergeAll(
  [
    libs,
    R.prop('nodeTypes', mergedData),
    getPatchNodes(mergedData),
  ]
));

export default (unpackedData, libs = {}) => {
  const mergedData = mergeById(unpackedData);
  const packedData = {
    meta: getProjectMeta(mergedData),
    folders: getProjectFolders(mergedData),
  };

  packedData.patches = getPatches(mergedData, packedData.folders);
  packedData.nodeTypes = getNodeTypes(mergedData, libs);

  return packedData;
};
