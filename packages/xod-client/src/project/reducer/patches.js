import R from 'ramda';
import patchReducer, { newPatch } from './patch';
import applyReducers from '../../utils/applyReducers';
import {
  PATCH_ADD,
  PATCH_DELETE,
} from '../actionTypes';

// :: [ 'patchIds' ] -> { patchId: reducer }
const generateReducers = R.reduce(
  (acc, id) => R.assoc(id, patchReducer(id), acc),
  {}
);

export default (patchIds) => {
  const reducers = generateReducers(patchIds);

  return (state = {}, action) => {
    switch (action.type) {
      case PATCH_ADD:
        return R.assoc(
          action.payload.id,
          newPatch({
            id: action.payload.id,
            label: action.payload.label,
            folderId: action.payload.folderId,
          }),
          state
        );
      case PATCH_DELETE:
        return R.omit([action.payload.id], state);
      default:
        return applyReducers(reducers, state, action);
    }
  };
};
export { newPatch } from './patch';
