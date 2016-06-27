import initialState from '../state';
import R from 'ramda';

export const patches = (state, action) => {
  const newState = (state === undefined) ? R.clone(initialState.project.patches) : state;

  switch (action.type) {
    default:
      return newState;
  }
};
