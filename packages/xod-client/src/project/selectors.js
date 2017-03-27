import R from 'ramda';
import {
  lensPatch,
  getPatchLabel,
} from 'xod-project';
import {
  getCurrentPatchId,
  getTabs,
} from '../editor/selectors';

export const getProjectV2 = R.prop('projectV2');

export const getPreparedTabs = (state) => {
  const currentPatchId = getCurrentPatchId(state);

  const projectV2 = getProjectV2(state);

  return R.pipe(
    getTabs,
    R.values,
    R.map((tab) => {
      const patchId = tab.id;

      const label = R.compose(
        getPatchLabel,
        R.view(lensPatch(patchId))
      )(projectV2);

      return R.merge(
        tab,
        {
          label,
          isActive: (currentPatchId === tab.patchId),
        }
      );
    }),
    R.indexBy(R.prop('id'))
  )(state);
};

