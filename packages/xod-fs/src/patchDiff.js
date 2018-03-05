import * as R from 'ramda';
import { getPatchPath } from 'xod-project';
import { isAmong } from 'xod-func-tools';

import { def } from './types';
import { CHANGE_TYPES } from './constants';

const isEqualPatchPaths = def(
  'isEqualPatchPaths :: Patch -> Patch -> Boolean',
  R.useWith(R.equals, [getPatchPath, getPatchPath])
);

const createPatchChange = def(
  'createPatchChange :: AnyChangeType -> Patch -> AnyPatchChange',
  (changeType, patch) =>
    R.compose(
      R.when(
        () =>
          changeType === CHANGE_TYPES.ADDED ||
          changeType === CHANGE_TYPES.MODIFIED,
        R.assoc('data', patch)
      ),
      R.applySpec({
        path: getPatchPath,
        changeType: R.always(changeType),
      })
    )(patch)
);

export const calculateAdded = def(
  'calculateAdded :: [Patch] -> [Patch] -> [AddedPatchChange]',
  R.compose(
    R.map(createPatchChange(CHANGE_TYPES.ADDED)),
    R.flip(R.differenceWith(isEqualPatchPaths))
  )
);

export const calculateModified = def(
  'calculateModified :: [Patch] -> [Patch] -> [ModifiedPatchChange]',
  (before, after) => {
    const beforeIds = R.map(getPatchPath, before);
    return R.compose(
      R.map(createPatchChange(CHANGE_TYPES.MODIFIED)),
      R.difference(R.__, before),
      R.filter(R.compose(isAmong(beforeIds), getPatchPath))
    )(after);
  }
);

export const calculateDeleted = def(
  'calculateDeleted :: [Patch] -> [Patch] -> [DeletedPatchChange]',
  R.compose(
    R.map(createPatchChange(CHANGE_TYPES.DELETED)),
    R.differenceWith(isEqualPatchPaths)
  )
);

export const calculateDiff = def(
  'calculateDiff :: [Patch] -> [Patch] -> [AnyPatchChange]',
  R.converge(R.unapply(R.unnest), [
    calculateAdded,
    calculateModified,
    calculateDeleted,
  ])
);
