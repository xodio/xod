import initialState from '../state';

export const patches = (state, action) => {
  let newState = (state === undefined) ? initialState.project.patches : state;
  switch (action.type) {
    default:
      return newState;
  }
};
