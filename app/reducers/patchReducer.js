import applyReducers from '../utils/applyReducers';

import { pins } from './pins';
import { links } from './links';
import { nodes } from './nodes';

export const patchReducer = (state = {}, action, context) => {
  const reducers = {
    links,
    pins,
    nodes,
  };

  if (action.type === 'TEST') {
    return JSON.parse(action.payload);
  }

  return applyReducers(reducers, state, action, context);
};
