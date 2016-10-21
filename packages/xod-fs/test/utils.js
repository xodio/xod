import R from 'ramda';
import { mapIndexed } from 'xod-core';

export const numerateFolders = initialFolders => {
  const accordance = {};

  return R.pipe(
    R.values,
    R.sortBy(R.prop('name')),
    mapIndexed(
      (folder, idx) => {
        accordance[folder.id] = idx;
        return R.assoc('id', idx, folder);
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

// :: patches { { folderId: ???, ... } } -> patches { { folderId: '0', ... } }
export const replaceFolderId = R.map(R.assoc('folderId', '0'));

export const expectEqualToXodball = (packed, xodball, expect) => {
  expect(packed.meta).to.deep.equal(xodball.meta);
  expect(replaceFolderId(packed.patches)).to.deep.equal(replaceFolderId(xodball.patches));
  expect(numerateFolders(packed.folders)).to.deep.equal(numerateFolders(xodball.folders));
  expect(packed.nodeTypes).to.deep.equal(xodball.nodeTypes);
};
