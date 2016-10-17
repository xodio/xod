import R from 'ramda';
import { v4 as generateId } from 'uuid';

const indexById = R.indexBy(R.prop('id'));

// :: "may/be/path/to/somename.of.file.ext" ->
//      fileType ("patch-meta"|"patch-data"|"project-meta")
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

// :: "./project/path/to/patch/and/file.ext" -> { type, folders }
const parsePath = R.pipe(
  R.split('/'),
  R.reject(R.equals('.')),
  (path) => ({
    type: getFileType(R.last(path)),
    folders: R.pipe(
      R.slice(1, -2),
      R.join('/')
    )(path),
  })
);

// :: unpackedFileData { path, content } -> { type, folders, content }
const replacePathByTypeAndFolders = unpackedFileData => R.pipe(
  R.flip(R.merge)(
    parsePath(R.prop('path', unpackedFileData), unpackedFileData)
  ),
  R.omit('path')
)(unpackedFileData);

// :: unpackedData -> mergedData [ { id, type, folders, content } ]
const mergeById = R.pipe(
  R.groupBy(R.prop('id')),
  R.values,
  R.map(
    group => {
      if (group.length > 1) {
        return R.pipe(
          replacePathByTypeAndFolders,
          R.assoc('content', R.merge(group[0].content, group[1].content))
        )(group[0]);
      }
      return replacePathByTypeAndFolders(group[0]);
    }
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
  R.map(R.split('/')),
  recursiveCreateFolders
);
// :: mergedData -> patches
const filterPatches = R.filter(R.propEq('type', 'patch'));

// :: mergedData -> patches [{ id, label, nodes, links }, ...]
const getPatches = R.pipe(
  filterPatches,
  R.map(
    R.pipe(
      R.prop('content'),
      R.pick(['id', 'label', 'nodes', 'links']),
      R.merge({ nodes: {}, links: {}, folderId: null })
    )
  ),
  indexById
  // @TODO: add folderId's!
);

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
const getNodeTypes = mergedData => R.merge(
  R.prop('nodeTypes', mergedData),
  getPatchNodes(mergedData)
);

export default (unpackedData) => {
  const mergedData = mergeById(unpackedData);
  const packedData = {
    meta: getProjectMeta(mergedData),
    folders: getProjectFolders(mergedData),
  };

  packedData.patches = getPatches(mergedData);
  packedData.nodeTypes = getNodeTypes(mergedData);

  return packedData;
};
