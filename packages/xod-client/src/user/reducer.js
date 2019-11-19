import * as R from 'ramda';

import * as ActionTypes from './actionTypes';

const userReducer = (state = {}, action) => {
  switch (action.type) {
    case ActionTypes.UPDATE_BALANCES:
      return R.assoc('balances', action.payload, state);
    case ActionTypes.LOGIN_STARTED:
      return R.assoc('isAuthorising', true, state);
    case ActionTypes.LOGIN_FAILED:
      return R.assoc('isAuthorising', false, state);
    case ActionTypes.SET_AUTH_GRANT: {
      const grant = action.payload;

      if (grant == null) return R.assoc('grant', grant, state);

      return R.merge(state, {
        grant,
        isAuthorising: false,
      });
    }
    default:
      return state;
  }
};

export default userReducer;
