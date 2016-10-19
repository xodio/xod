import R from 'ramda';

export const numerateFolders = initialFolders => {
  let id = 0;
  const accordance = {};

  return R.pipe(
    R.values,
    R.sortBy(R.prop('name')),
    R.map(
      folder => {
        id += 1;
        accordance[folder.id] = id;
        return R.assoc('id', id, folder);
      }
    ),
    R.map(
      folder => {
        if (folder.parentId === null) {
          return folder;
        }
        return R.assoc('parentId', accordance[folder.parentId], folder);
      }
    )
  )(initialFolders);
};

export const replaceFolderId = R.map(R.assoc('folderId', '0'));
