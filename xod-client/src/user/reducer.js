import R from 'ramda';

import { ApiHelpers, ApiActionTypes } from 'xod-client/api';
import * as Selectors from './selectors';

export default (userState = {}, action) => {
  switch (action.type) {
    case ApiActionTypes.user.login: {
      if (ApiHelpers.isError(action)) { return {}; }

      if (!ApiHelpers.completedResponse(action)) {
        return userState;
      }

      return R.pipe(
        R.assoc('access_token', action.payload.response.id),
        R.assoc('user_id', action.payload.response.userId),
        R.assoc('username', action.payload.response.username),
        R.assoc('userpic', action.payload.response.userpic),
        R.assoc('projects', Selectors.indexById(action.payload.response.projects))
      )(userState);
    }
    case ApiActionTypes.user.findById: {
      if (ApiHelpers.isError(action)) { return {}; }

      if (!ApiHelpers.completedResponse(action) || !ApiHelpers.currentUser(action, userState)) {
        return userState;
      }

      return R.pipe(
        R.assoc('username', action.payload.response.username),
        R.assoc('userpic', action.payload.response.userpic),
        R.assoc('projects', Selectors.indexById(action.payload.response.projects))
      )(userState);
    }
    case ApiActionTypes.project.save:
    case ApiActionTypes.project.load: {
      if (!ApiHelpers.completedResponse(action)) {
        return userState;
      }

      const id = action.payload.response.id;
      return R.assocPath(['projects', id], action.payload.response, userState);
    }
    case ApiActionTypes.user.logout:
      return {};
    default:
      return userState;
  }
};
