import R from 'ramda';
import { listPatches, getPatchPath } from 'xod-project';
import { getProjectV2 } from './selectors';

import {
  PATCH_HISTORY_UNDO,
  PATCH_HISTORY_REDO,
  PATCH_HISTORY_SAVE,
  PATCH_HISTORY_CLEAR_FOR_PATCH,
  PATCH_HISTORY_CLEAR_ALL,
} from './actionTypes';

const isHistoryActionType = R.contains(R.__, [
  PATCH_HISTORY_UNDO,
  PATCH_HISTORY_REDO,
  PATCH_HISTORY_SAVE,
  PATCH_HISTORY_CLEAR_FOR_PATCH,
  PATCH_HISTORY_CLEAR_ALL,
]);

export default ({ getState, dispatch }) => next => (action) => {
  if (isHistoryActionType(action.type)) {
    next(action);
    return;
  }

  const previousPatchesList = R.compose(listPatches, getProjectV2, getState)();

  next(action);

  const currentPatches = R.compose(
    R.indexBy(getPatchPath),
    listPatches,
    getProjectV2,
    getState
  )();

  // does not include added patches, but that's ok
  const changedPreviousPatchesList = R.filter(
    prev => !R.equals(prev, currentPatches[getPatchPath(prev)]),
    previousPatchesList
  );

  if (changedPreviousPatchesList.length === 1) {
    const previousPatchState = R.head(changedPreviousPatchesList);

    const changedPatchId = getPatchPath(previousPatchState);
    if (!currentPatches[changedPatchId]) {
      // patch was deleted, but nothing else was affected
      dispatch({
        type: PATCH_HISTORY_CLEAR_FOR_PATCH,
        payload: {
          patchId: changedPatchId,
        },
      });
      return;
    }

    dispatch({
      type: PATCH_HISTORY_SAVE,
      payload: {
        previousPatchState,
      },
    });
  } else if (changedPreviousPatchesList.length > 1) {
    // some destructive stuff happened
    dispatch({
      type: PATCH_HISTORY_CLEAR_ALL,
    });
  }
};
