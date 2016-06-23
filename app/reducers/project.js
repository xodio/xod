import initialState from '../state';

export const project = (state, action) => {
  const newState = (state === undefined) ? initialState.project.project : state;
  switch (action.type) {
    default:
      return newState;
  }
};
