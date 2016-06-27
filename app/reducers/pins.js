import initialState from '../state';
import R from 'ramda';

export const pins = (state, action) => {
  const newState = (state === undefined) ? R.clone(initialState.project.pins) : state;
  switch (action.type) {
    default:
      return newState;
  }
};
