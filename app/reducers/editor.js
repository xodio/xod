import initialState from '../state';
import update from 'react-addons-update';

export const editor = (state, action) => {
  const newState = (state === undefined) ? update(state, {
    $set: initialState.editor,
  }) : state;
  switch (action.type) {
    default:
      return newState;
  }
};
