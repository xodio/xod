import R from 'ramda';
import { getPatchPath } from 'xod-project';

import { def } from './types';
import { isProjectFile, isPatchFile, getFileContent } from './utils';

export default def(
  'packProject :: [AnyXodFile] -> PatchMap -> Project',
  (unpackedData, libraryPatches = {}) => {
    const project = R.compose(
      R.dissoc('libs'),
      getFileContent,
      R.find(isProjectFile)
    )(unpackedData);

    const projectPatches = R.compose(
      R.indexBy(getPatchPath),
      R.map(getFileContent),
      R.filter(isPatchFile)
    )(unpackedData);

    const patches = R.merge(libraryPatches, projectPatches);

    return R.assoc('patches', patches, project);
  }
);
