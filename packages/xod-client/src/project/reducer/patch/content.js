import applyReducers from '../../../utils/applyReducers';

import { links } from './links';
import { nodes } from './nodes';

export default (id) => {
  const patchId = id;
  const initialPatchState = {
    nodes: {},
    links: {},
  };

  return (state = initialPatchState, action) => {
    const reducers = {
      links,
      nodes,
    };

    if (
      action &&
      action.meta &&
      action.meta.patchId &&
      action.meta.patchId !== patchId
    ) {
      return state;
    }

    return applyReducers(reducers, state, action, patchId);
  };
};
