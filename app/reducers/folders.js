import R from 'ramda';
import * as ActionType from '../actionTypes';

export const foldersReducer = (state = {}, action) => {
  switch (action.type) {
    case ActionType.FOLDER_RENAME: {
      return R.assocPath([action.payload.id, 'name'], action.payload.name, state);
    }
    case ActionType.FOLDER_DELETE: {
      return R.omit([action.payload.id.toString()], state);
    }
    default:
      return state;
  }
};
