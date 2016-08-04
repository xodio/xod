import R from 'ramda';
import {
  FOLDER_ADD,
  FOLDER_RENAME,
  FOLDER_DELETE,
} from '../actionTypes';

const newFolder = (action) => ({
  id: action.payload.newId,
  name: action.payload.name || 'New folder',
  parentId: action.payload.parentId || null,
});

export const foldersReducer = (state = {}, action) => {
  switch (action.type) {
    case FOLDER_ADD:
      return R.assoc(action.payload.newId, newFolder(action), state);
    case FOLDER_RENAME:
      return R.assocPath([action.payload.id, 'name'], action.payload.name, state);
    case FOLDER_DELETE: {
      return R.omit([action.payload.id.toString()], state);
    }
    default:
      return state;
  }
};
