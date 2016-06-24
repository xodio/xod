import initialState from '../state';
import update from 'react-addons-update';

export const links = (state, action) => {
  const newState = (state === undefined) ? update(state, {
    $set: initialState.project.links,
  }) : state;
  switch (action.type) {
    default:
      return newState;
  }
};
