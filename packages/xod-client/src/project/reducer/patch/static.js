import R from 'ramda';
import { PATCH_RENAME, PATCH_MOVE } from '../../actionTypes';

const defaultState = {
  label: 'New patch',
  folderId: null,
};

export default (id) => (inputState = defaultState, action) => {
  const state = R.evolve({
    id: R.defaultTo(id),
  })(inputState);

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
