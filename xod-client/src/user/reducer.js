import R from 'ramda';

import { ApiHelpers, ApiActionTypes } from 'xod-client/api';

export default (userState = {}, action) => {
  switch (action.type) {
    case ApiActionTypes.user.login: {
      if (ApiHelpers.isError(action)) { return {}; }

      if (!ApiHelpers.completedResponse(action)) {
        return userState;
      }

      return R.pipe(
        R.assoc('access_token', action.payload.response.id),
        R.assoc('user_id', action.payload.response.userId)
      )(userState);
    }
    case ApiActionTypes.user.findById: {
      if (ApiHelpers.isError(action)) { return {}; }

      if (!ApiHelpers.completedResponse(action) || !ApiHelpers.currentUser(action, userState)) {
        return userState;
      }

      return R.pipe(
        R.assoc('username', action.payload.response.username),
        R.assoc('userpic', action.payload.response.userpic)
      )(userState);
    }
    case ApiActionTypes.user.logout:
      return {};
    default:
      return userState;
  }
};
