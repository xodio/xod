import R from 'ramda';
import {
  SET_WORKSPACE,
} from './actionTypes';

const initialState = {
  workspace: null,
};

const settingsReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_WORKSPACE:
      return R.assoc('workspace', action.payload, state);
    default:
      return state;
  }
};

export default settingsReducer;
