import initialState from '../state';

export const links = (state, action) => {
  const newState = (state === undefined) ? initialState.project.links : state;
  switch (action.type) {
    default:
      return newState;
  }
};
