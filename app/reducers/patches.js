import initialState from '../state';
import update from 'react-addons-update';

export const patches = (state, action) => {
  const newState = (state === undefined) ? update(state, {
    $set: initialState.project.patches,
  }) : state;
  switch (action.type) {
    default:
      return newState;
  }
};
