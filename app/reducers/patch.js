import applyReducers from '../utils/applyReducers';

import { pins } from './pins';
import { links } from './links';
import { nodes } from './nodes';

export const patchReducer = (id) => {
  const patchId = id;

  return (state = {}, action) => {
    const reducers = {
      links,
      pins,
      nodes,
    };

    return applyReducers(reducers, state, action, patchId);
  };
};
