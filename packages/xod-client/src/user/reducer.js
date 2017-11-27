import R from 'ramda';

import * as ActionTypes from './actionTypes';

const userReducer = (state = {}, action) => {
  switch (action.type) {
    case ActionTypes.TOGGLE_ACCOUNT_PANE:
      return R.compose(
        R.over(R.lensProp('isAccountPaneVisible'), R.not),
        R.assoc('authError', null)
      )(state);
    case ActionTypes.UPDATE_COMPILE_LIMIT:
      return R.assoc('limit', action.payload, state);
    case ActionTypes.LOGIN_STARTED:
      return R.merge(state, {
        isAuthorising: true,
      });
    case ActionTypes.LOGIN_FAILED:
      return R.merge(state, {
        isAuthorising: false,
        authError: action.payload,
      });
    case ActionTypes.SET_AUTH_GRANT: {
      const grant = action.payload;

      if (grant == null) return R.assoc('grant', grant, state);

      return R.merge(state, {
        grant,
        isAuthorising: false,
        authError: null,
      });
    }
    default:
      return state;
  }
};

export default userReducer;
