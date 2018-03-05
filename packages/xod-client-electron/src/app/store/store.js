import { createStore, combineReducers } from 'redux';
import * as AT from './actionTypes';

const projectPathReducer = (state = null, action) => {
  if (action.type === AT.UPDATE_PROJECT_PATH) {
    return action.payload;
  }
  return state;
};

export default initialState =>
  createStore(
    combineReducers({
      projectPath: projectPathReducer,
    }),
    initialState
  );
