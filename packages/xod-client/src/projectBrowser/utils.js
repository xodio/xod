import R from 'ramda';
import XP from 'xod-project';

import { getProjectV2 } from '../project/selectors';

// eslint-disable-next-line import/prefer-default-export
export const isPatchEmpty = (state, patchId) =>
    R.compose(
      R.isEmpty,
      XP.listNodes,
      R.view(XP.lensPatch(patchId)),
      getProjectV2
    )(state);
