import { getProject } from '../project/selectors';

import { getDeducedTypes, getErrors } from './selectors';
import updateHinting from './actions';
import { shallDeduceTypes, deduceTypes } from './typeDeduction';
import { shallValidate, validateProject } from './validation';

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

  // Type deducing
  const prevDeducedTypes = getDeducedTypes(newState);
  const nextDeducedTypes = shallDeduceTypes(newProject, action)
    ? deduceTypes(newProject, action, prevDeducedTypes)
    : prevDeducedTypes;
  const willUpdateDeducedTypes = notEquals(prevDeducedTypes, nextDeducedTypes);

  // Validation
  const prevErrors = getErrors(newState);
  const nextErrors = shallValidate(action, newProject, nextDeducedTypes)
    ? validateProject(action, newProject, nextDeducedTypes, prevErrors)
    : prevErrors;
  const willUpdateErrors = notEquals(prevErrors, nextErrors);

  // Dispatch changes, if needed
  if (willUpdateDeducedTypes || willUpdateErrors) {
    store.dispatch(
      updateHinting(
        willUpdateDeducedTypes ? nextDeducedTypes : null,
        willUpdateErrors ? nextErrors : null
      )
    );
  }

  return act;
};
