// const VIEWSTATE_UPDATE = 'VIEWSTATE_UPDATE';

export const viewState = (state, action) => {
  const initialState = {
    nodes: {},
    pins: {},
    links: {},
  };
  const newState = (state === undefined) ? initialState : state;

  switch (action.type) {
    default:
      return newState;
  }
};
