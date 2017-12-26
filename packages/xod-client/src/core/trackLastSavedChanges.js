import * as R from 'ramda';

import { getProject } from '../project/selectors';

import {
  PROJECT_CREATE,
  PROJECT_OPEN,
  PROJECT_IMPORT,
  PROJECT_OPEN_WORKSPACE,
  SAVE_ALL,
} from '../project/actionTypes';

export default function trackLastSavedChanges(state, action) {
  switch (action.type) {
    case PROJECT_CREATE:
    case PROJECT_OPEN:
    case PROJECT_IMPORT:
    case SAVE_ALL:
    case PROJECT_OPEN_WORKSPACE: {
      return R.assoc(
        'lastSavedProject',
        getProject(state),
        state
      );
    }

    default:
      return state;
  }
}
