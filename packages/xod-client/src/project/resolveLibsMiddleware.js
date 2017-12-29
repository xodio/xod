import * as R from 'ramda';
import { explode } from 'xod-func-tools';
import { listMissingLibraryNames } from 'xod-project';
import { parseLibQuery } from 'xod-pm';

import { installLibraries } from '../editor/actions';
import { PROJECT_OPEN, PROJECT_IMPORT } from './actionTypes';
import { getProject } from './selectors';

export default store => next => (action) => {
  const res = next(action);

  if (R.contains(action.type, [PROJECT_OPEN, PROJECT_IMPORT])) {
    const project = getProject(store.getState());
    const missingLibParams = R.compose(
      R.map(R.compose(
        explode,
        parseLibQuery
      )),
      listMissingLibraryNames
    )(project);

    if (missingLibParams.length > 0) {
      store.dispatch(installLibraries(missingLibParams));
    }
  }

  return res;
};
