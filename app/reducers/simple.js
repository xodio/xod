import update from 'react-addons-update';

export const simple = (state = {}, action) => {
  switch (action.type) {
    case 'PROJECT_CHANGE': {
      const r = update(state, {
        $merge: action.data,
      });
      console.log('!', action, r);
      return r;
    }
    default:
      return state;
  }
};
