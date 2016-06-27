import initialState from '../state';
import update from 'react-addons-update';

export const nodeTypes = (state, action) => {
  const newState = (state === undefined) ? update(state, {
    $set: initialState.nodeTypes,
  }) : state;
  switch (action.type) {
    default:
      return newState;
  }
};
