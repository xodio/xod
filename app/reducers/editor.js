import initialState from '../state';

export const editor = (state, action) => {
  const newState = (state === undefined) ? initialState.editor : state;
  switch (action.type) {
    default:
      return newState;
  }
};
