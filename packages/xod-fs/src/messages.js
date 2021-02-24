import * as R from 'ramda';
import { PROJECT_LOADED_WITH_INVALID_PATCH_PATHS } from './errorCodes';

const formatPatchPaths = R.compose(
  R.join(', '),
  R.when(
    patchPaths => patchPaths.length > 3,
    R.compose(R.append('…'), R.take(3))
  )
);

export default {
  [PROJECT_LOADED_WITH_INVALID_PATCH_PATHS]: ({ patchPaths }) => ({
    title: 'Cannot load some patches',
    note: `Some patches have an invalid patch paths: ${formatPatchPaths(
      patchPaths
    )}`,
    solution:
      'Open the "__lib__" directory in your workspace and ensure that listed directory names are valid. Only lowercase latin alphabet, numbers, and hypens are allowed.',
  }),
};
