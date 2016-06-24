import initialState from '../state';
import update from 'react-addons-update';

export const meta = (state, action) => {
  const newState = (state === undefined) ? update(state, {
    $set: initialState.project.meta,
  }) : state;
  switch (action.type) {
    case 'META_UPDATE': {
      return update(newState, {
        $merge: action.data,
      });
    }
    default:
      return newState;
  }
};
