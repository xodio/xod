import initialState from '../state';

export const pins = (state, action) => {
  let newState = (state === undefined) ? initialState.project.pins : state;
  switch (action.type) {
    default:
      return newState;
  }
};
