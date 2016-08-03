import R from 'ramda';
import {
  FOLDER_RENAME,
  FOLDER_DELETE,
} from '../actionTypes';

export const foldersReducer = (state = {}, action) => {
  switch (action.type) {
    case FOLDER_RENAME: {
      return R.assocPath([action.payload.id, 'name'], action.payload.name, state);
    }
    case FOLDER_DELETE: {
      return R.omit([action.payload.id.toString()], state);
    }
    default:
      return state;
  }
};
