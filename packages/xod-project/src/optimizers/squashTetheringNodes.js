import * as R from 'ramda';

import { updatePatch } from '../project';
import squashSingleOutputNodes from './squashSingleOutputNodes';
import { TETHERING_INET_PATH } from '../constants';

// :: PatchPath -> Project -> Either Error Project
export default R.curry((path, project) =>
  updatePatch(path, squashSingleOutputNodes(TETHERING_INET_PATH), project)
);
