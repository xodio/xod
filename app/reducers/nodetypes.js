import initialState from '../state';
import R from 'ramda';

export const nodeTypes = (state, action) => {
  const newState = (state === undefined) ? R.clone(initialState.nodeTypes) : state;

  switch (action.type) {
    default:
      return newState;
  }
};
