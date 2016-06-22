import initialState from '../state';

export const links = (state, action) => {
  let newState = (state === undefined) ? initialState.project.links : state;
  switch (action.type) {
    default:
      return newState;
  }
};
