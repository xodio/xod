import initialState from '../state';

export const editor = (state, action) => {
  let newState = (state === undefined) ? initialState.editor : state;
  switch (action.type) {
    default:
      return newState;
  }
};
