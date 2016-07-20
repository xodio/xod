import R from 'ramda';

import { PROJECT_LOAD_DATA } from '../actionTypes';

import { patches } from './patches';
import { pins } from './pins';
import { links } from './links';
import { nodes } from './nodes';
import { nodeTypes } from './nodetypes';
import { meta } from './meta';

export default (state = {}, action) => {
  const reducers = {
    meta,
    patches,
    nodeTypes,
    links,
    pins,
    nodes,
  };

  let hasChanged = false;

  if (action.type === PROJECT_LOAD_DATA) {
    return JSON.parse(action.payload);
  }

  const nextState = R.pipe(
    R.keys,
    R.reduce((nState, key) => {
      const prevStateForKey = nState[key];
      const nextStateForKey = reducers[key](nState[key], action, nState);
      hasChanged = hasChanged || nextStateForKey !== prevStateForKey;

      return R.assoc(key, nextStateForKey, nState);
    }, state)
  )(reducers);

  return hasChanged ? nextState : state;
};
