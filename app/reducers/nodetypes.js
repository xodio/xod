import initialState from '../state';

export const nodeTypes = (state, action) => {
  let newState = (state === undefined) ? initialState.nodeTypes : state;
  switch (action.type) {
    default:
      return newState;
  }
};
