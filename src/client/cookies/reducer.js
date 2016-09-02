import R from 'ramda';

import * as Selectors from './selectors';
import { STATUS } from 'xod/client/utils/constants';
import { ApiActionTypes } from 'xod/client/api';
import { UPDATE_COOKIES } from './constants';

const isSucceeded = (action) => (action.meta && action.meta.status === STATUS.SUCCEEDED);
const hasResponse = (action) => (action.payload && action.payload.response);
const completedResponse = (action) => isSucceeded(action) && hasResponse(action);
const currentUser = (action, state) => (
  hasResponse(action) &&
  action.payload.response.id === Selectors.userId(state)
);

const isError = (action) => (action.error === true);
const dropUserInfo = R.omit(['access_token', 'user_id', 'username', 'userpic']);

export default (cookieState = {}, action) => {
  switch (action.type) {
    case UPDATE_COOKIES:
      return action.payload;
    case ApiActionTypes.profile.login: {
      if (isError(action)) { return dropUserInfo(cookieState); }

      if (!completedResponse(action)) {
        return cookieState;
      }

      return R.pipe(
        R.assoc('access_token', action.payload.response.id),
        R.assoc('user_id', action.payload.response.userId)
      )(cookieState);
    }
    case ApiActionTypes.profile.user: {
      if (isError(action)) { return dropUserInfo(cookieState); }

      if (!completedResponse(action) || !currentUser(action, cookieState)) {
        return cookieState;
      }

      return R.pipe(
        R.assoc('username', action.payload.response.username),
        R.assoc('userpic', action.payload.response.userpic)
      )(cookieState);
    }
    case ApiActionTypes.profile.logout:
      return dropUserInfo(cookieState);
    default:
      return cookieState;
  }
};
