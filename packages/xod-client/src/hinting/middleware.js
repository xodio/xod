import { notEquals } from 'xod-func-tools';

import { getProject } from '../project/selectors';

import { getDeducedTypes, getErrors } from './selectors';
import { updateDeducedTypes, updateErrors, updateHinting } from './actions';
import { shallDeduceTypes, deducePinTypesForProject } from './typeDeduction';
import { shallValidate, validateProject } from './validators';

// =============================================================================
//
// Middleware
//
// =============================================================================

export default store => next => action => {
  const oldProject = getProject(store.getState());
  const act = next(action);
  const newState = store.getState();
  const newProject = getProject(newState);

  if (oldProject === newProject) return newState;

  const prevDeducedTypes = getDeducedTypes(newState);
  const nextDeducedTypes = shallDeduceTypes(newProject, action)
    ? deducePinTypesForProject(newProject, action, prevDeducedTypes)
    : prevDeducedTypes;
  const willUpdateDeducedTypes = notEquals(prevDeducedTypes, nextDeducedTypes);

  const prevErrors = getErrors(newState);
  const nextErrors = shallValidate(action, newProject, nextDeducedTypes)
    ? validateProject(action, newProject, nextDeducedTypes, prevErrors)
    : prevErrors;
  const willUpdateErrors = notEquals(prevErrors, nextErrors);

  if (willUpdateDeducedTypes && willUpdateErrors) {
    next(updateHinting(nextDeducedTypes, nextErrors));
  } else if (willUpdateDeducedTypes) {
    next(updateDeducedTypes(nextDeducedTypes));
  } else if (willUpdateErrors) {
    next(updateErrors(nextErrors));
  }

  return act;
};
