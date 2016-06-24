import initialState from '../state';
import ViewStateGenerator from '../utils/viewstateGenerator';

import update from 'react-addons-update';
import * as ActionType from '../actionTypes';

const vsGenerator = new ViewStateGenerator();

export const viewState = (state, action) => {
  const newState = (state === undefined) ? update(state, {
    $set: vsGenerator.create(initialState),
  }) : state;
  // @TODO: Use const instead of string action name!
  switch (action.type) {
    case ActionType.VIEWSTATE_UPDATE:
      return update(newState, {
        $set: vsGenerator.create(action.state),
      });
    default:
      return newState;
  }
};
