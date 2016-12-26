import applyReducers from '../../../utils/applyReducers';

import { links } from './links';
import { nodes } from './nodes';

export default () => {
  const initialPatchState = {
    nodes: {},
    links: {},
  };
  const reducers = {
    links,
    nodes,
  };

  return (state = initialPatchState, action) => applyReducers(reducers, state, action, state);
};
