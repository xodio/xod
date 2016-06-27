import initialState from '../state';
import viewStateGenerator from '../utils/ViewStateGenerator';
import * as ActionType from '../actionTypes';

const vsGenerator = new viewStateGenerator();

export const viewState = (state, action) => {
  const newState = (state === undefined) ? vsGenerator.create(initialState) : state;
  switch (action.type) {
    case ActionType.VIEWSTATE_UPDATE:
      return vsGenerator.create(action.payload.state);
    default:
      return newState;
  }
};
