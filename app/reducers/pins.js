import initialState from '../state';
import update from 'react-addons-update';

export const pins = (state, action) => {
  const newState = (state === undefined) ? update(state, {
    $set: initialState.project.pins,
  }) : state;
  switch (action.type) {
    default:
      return newState;
  }
};
