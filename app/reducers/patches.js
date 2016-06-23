import initialState from '../state';

export const patches = (state, action) => {
  const newState = (state === undefined) ? initialState.project.patches : state;
  switch (action.type) {
    default:
      return newState;
  }
};
