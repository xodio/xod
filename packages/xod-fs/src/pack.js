import R from 'ramda';
import { hasExt } from './utils';

export default (unpackedData, libraryPatches = {}) => {
  const project = R.compose(
    R.dissoc('libs'),
    R.prop('content'),
    R.find(R.compose(
      hasExt('.xod'),
      R.prop('path')
    ))
  )(unpackedData);

  const projectPatches = R.compose(
    R.indexBy(R.prop('path')),
    R.map(R.prop('content')),
    R.filter(R.compose(
      hasExt('.xodp'),
      R.prop('path')
    ))
  )(unpackedData);

  const patches = R.merge(libraryPatches, projectPatches);

  return R.assoc('patches', patches, project);
};
