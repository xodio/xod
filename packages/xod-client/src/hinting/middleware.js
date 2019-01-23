import { notEquals } from 'xod-func-tools';

import { getProject } from '../project/selectors';

import {
  getDeducedTypes,
  getErrors,
  getPatchSearchData,
  getPatchMarkers,
} from './selectors';
import updateHinting from './actions';
import { shallDeduceTypes, deduceTypes } from './typeDeduction';
import { shallValidate, validateProject } from './validation';
import {
  shallUpdatePatchSearchData,
  getNewPatchSearchData,
} from './patchSearchData';
import { shallUpdatePatchMarkers, getNewPatchMarkers } from './patchMarkers';

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

  // Patch Search Indexing
  const prevSearchIndex = getPatchSearchData(newState);
  const nextSearchIndex = shallUpdatePatchSearchData(newProject, action)
    ? getNewPatchSearchData(prevSearchIndex, newProject, action)
    : prevSearchIndex;
  const willUpdateSearchIndex = notEquals(prevSearchIndex, nextSearchIndex);

  // Patch Flags
  const prevPatchMarkers = getPatchMarkers(newState);
  const nextPatchMarkers = shallUpdatePatchMarkers(action)
    ? getNewPatchMarkers(prevPatchMarkers, newProject, action)
    : prevPatchMarkers;
  const willUpdatePatchMarkers = notEquals(prevPatchMarkers, nextPatchMarkers);

  // Dispatch changes, if needed
  if (willUpdateDeducedTypes || willUpdateErrors || willUpdateSearchIndex) {
    store.dispatch(
      updateHinting(
        willUpdateDeducedTypes ? nextDeducedTypes : null,
        willUpdateErrors ? nextErrors : null,
        willUpdateSearchIndex ? nextSearchIndex : null,
        willUpdatePatchMarkers ? nextPatchMarkers : null
      )
    );
  }

  return act;
};
