import path from 'path';
import R from 'ramda';
import { generateId, localID } from 'xod-core';

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
  projectPath => ({
    type: getFileType(R.last(projectPath)),
    folder: R.pipe(
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
const extractPathData = (unpackedFileData) => {
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
      (group) => {
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

// :: lib 'xod/core/someFolder/buzzer' -> 'xod/core/someFolder'
const getLibFolder = R.pipe(
  R.prop('id'),
  R.split('/'),
  R.init,
  R.join(path.sep)
);

// :: libs -> libsWithFolderPath
const extendLibsWithFolders = R.pipe(
  R.values,
  R.map(lib => R.assoc('folder', getLibFolder(lib), lib)),
  indexById
);

const mapFolders = R.pipe(
  R.values,
  R.map(R.prop('folder'))
);

// :: mergedData -> libs -> folders ['path']
const getFolders = R.curry(
  (mergedData, libs) => R.pipe(
    mapFolders,
    R.concat(
      mapFolders(libs)
    ),
    R.reject(R.isEmpty),
    R.uniq
  )(mergedData)
);

// :: folders -> folders { id, name, parentId }
const getProjectFolders = R.pipe(
  R.map(R.split(path.sep)),
  recursiveCreateFolders
);
// :: mergedData -> patches
const filterPatches = R.filter(R.propEq('type', 'patch'));

// :: libs -> libPatches
const filterLibPatches = R.filter(R.has('nodes'));

// :: folders -> patchFolder -> patch -> patchWithFolderId
const getPatch = R.curry(
  (folders, patchFolder, patch) => {
    const folderId = findFolderId(patchFolder, folders);
    return R.merge({ nodes: {}, links: {}, folderId }, patch);
  }
);

// :: patchFile -> patch
const pickPatchContent = R.pick(['id', 'label', 'nodes', 'links', 'impls']);

// :: lib -> libMeta
const removePatchContent = R.omit(['nodes', 'links', 'folder', 'folderId']);

// :: mergedData -> folders -> libs -> patches [{ id, label, nodes, links }, ...]
const getPatches = R.curry(
  (mergedData, folders, libs) => {
    const patches = R.pipe(
      filterPatches,
      R.map((patch) => {
        const picked = R.pipe(
          R.prop('content'),
          pickPatchContent
        )(patch);
        return getPatch(folders, patch.folder, picked);
      }),
      indexById
    )(mergedData);

    const libPatches = R.pipe(
      R.values,
      filterLibPatches,
      R.map((lib) => {
        const picked = pickPatchContent(lib);
        return getPatch(folders, lib.folder, picked);
      }),
      indexById
    )(libs);

    return R.merge(patches, libPatches);
  }
);

// :: patchFile -> boolean
const isPatchNode = R.compose(
  R.flip(R.gt)(0),
  R.length,
  R.values,
  R.pathOr([], ['content', 'pins'])
);

// :: mergedData -> patchNodes [{ id, patchNode, label, category, properties, pins }, ...]
const getPatchNodes = R.pipe(
  filterPatches,
  R.filter(
    isPatchNode
  ),
  R.map(
    R.pipe(
      R.prop('content'),
      R.pick(['id', 'label', 'category', 'properties', 'pins', 'description']),
      R.merge({ properties: {}, pins: {} })
    )
  ),
  indexById
);

// :: mergedData -> { ...nodeTypes, ...patchNodes }
const getNodeTypes = R.curry((mergedData, libs) => R.mergeAll(
  [
    R.mapObjIndexed(removePatchContent, libs),
    R.prop('nodeTypes', mergedData),
    getPatchNodes(mergedData),
  ]
));

export default (unpackedData, libs = {}) => {
  const mergedData = mergeById(unpackedData);
  const extendedLibs = extendLibsWithFolders(libs);
  const folders = getFolders(mergedData, extendedLibs);
  const packedData = {
    meta: getProjectMeta(mergedData),
    folders: getProjectFolders(folders),
  };

  packedData.patches = getPatches(mergedData, packedData.folders, extendedLibs);
  packedData.nodeTypes = getNodeTypes(mergedData, extendedLibs);

  return packedData;
};
