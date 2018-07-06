import * as R from 'ramda';

import { getProject } from '../project/selectors';

import {
  PROJECT_CREATE,
  PROJECT_OPEN,
  PROJECT_IMPORT,
  PROJECT_OPEN_WORKSPACE,
  SAVE_ALL,
} from '../project/actionTypes';

const updateLastSavedProject = state =>
  R.assoc('lastSavedProject', getProject(state), state);

export default function trackLastSavedChanges(state, action) {
  switch (action.type) {
    case PROJECT_CREATE:
    case PROJECT_OPEN:
    case PROJECT_IMPORT:
    case PROJECT_OPEN_WORKSPACE: {
      return updateLastSavedProject(state);
    }
    case SAVE_ALL: {
      if (R.path(['payload', 'data', 'updateLastSavedProject'], action)) {
        return updateLastSavedProject(state);
      }
      return state;
    }

    default:
      return state;
  }
}
