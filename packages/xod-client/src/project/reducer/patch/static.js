import R from 'ramda';
import { PATCH_RENAME, PATCH_MOVE } from '../../actionTypes';

export default (id) => (state = {
  id,
  label: 'New patch',
  folderId: null,
}, action) => {
  // There should be move patch, rename patch and etc
  switch (action.type) {
    case PATCH_RENAME: {
      const newState = R.assoc('label', action.payload.label, state);
      return newState;
    }
    case PATCH_MOVE:
      return R.assoc('folderId', action.payload.folderId, state);
    default:
      return state;
  }
};
