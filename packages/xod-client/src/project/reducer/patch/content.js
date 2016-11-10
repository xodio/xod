import R from 'ramda';
import applyReducers from '../../../utils/applyReducers';

import { links } from './links';
import { nodes } from './nodes';

export default (patchId) => {
  const initialPatchState = {
    nodes: {},
    links: {},
  };

  return (state = initialPatchState, action) => {
    if (!R.pathEq(['action', 'meta', 'patchId'], patchId)) { return state; }

    const reducers = {
      links,
      nodes,
    };

    return applyReducers(reducers, state, action, patchId);
  };
};
