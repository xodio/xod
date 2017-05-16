import R from 'ramda';

export const numerateFolders = (initialFolders) => {
  const accordance = {};

  return R.pipe(
    R.values,
    R.sortBy(R.prop('name')),
    R.mapObjIndexed(
      (folder, idx) => {
        accordance[folder.id] = idx;
        return R.assoc('id', idx, folder);
      }
    ),
    R.map(
      (folder) => {
        if (folder.parentId === null) {
          return folder;
        }
        return R.assoc('parentId', accordance[folder.parentId], folder);
      }
    )
  )(initialFolders);
};

// :: patches { { folderId: ???, ... } } -> patches { { folderId: '0', ... } }
export const replaceFolderId = R.map(R.assoc('folderId', '0'));
