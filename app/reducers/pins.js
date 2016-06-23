import initialState from '../state';

export const pins = (state, action) => {
  const newState = (state === undefined) ? initialState.project.pins : state;
  switch (action.type) {
    default:
      return newState;
  }
};
