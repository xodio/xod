import R from 'ramda';
import { PATCH_RENAME } from '../../actionTypes';

const defaultState = {
  label: 'New patch',
  folderId: null,
};

export default id => (inputState = defaultState, action) => {
  const state = R.evolve({
    id: R.defaultTo(id),
  })(inputState);

  switch (action.type) {
    case PATCH_RENAME: {
      return R.assoc('label', action.payload.label, state);
    }
    default:
      return state;
  }
};
