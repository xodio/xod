import initialState from '../state';

export const nodeTypes = (state, action) => {
  const newState = (state === undefined) ? initialState.nodeTypes : state;
  switch (action.type) {
    default:
      return newState;
  }
};
