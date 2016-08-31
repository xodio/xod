import R from 'ramda';

import { STATUS } from 'xod/client/utils/constants';
import { ApiActionTypes } from 'xod/client/utils/api';
import { UPDATE_COOKIES } from './constants';

const isSucceeded = (action) => (action.meta && action.meta.status === STATUS.SUCCEEDED);
const hasResponse = (action) => (action.payload && action.payload.response);

export default (cookieState = {}, action) => {
  switch (action.type) {
    case UPDATE_COOKIES:
      return action.payload;
    case ApiActionTypes.profile.login: {
      if (!(isSucceeded(action) && hasResponse(action))) {
        return cookieState;
      }
      return R.pipe(
        R.assoc('access_token', action.payload.response.id),
        R.assoc('user_id', action.payload.response.userId)
      )(cookieState);
    }
    case ApiActionTypes.profile.logout:
      return R.omit(['access_token', 'user_id']);
    default:
      return cookieState;
  }
};
