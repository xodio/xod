import R from 'ramda';
import {
  listPatches,
  assocPatch,
  getPatchPath,
  getPatchByPathUnsafe,
} from 'xod-project';
import { explode, isAmong } from 'xod-func-tools';

import { getProject, projectLens } from '../project/selectors';

import {
  PROJECT_CREATE,
  PROJECT_OPEN,
  PROJECT_IMPORT,
  PROJECT_OPEN_WORKSPACE,

  PATCH_HISTORY_UNDO,
  PATCH_HISTORY_REDO,
} from '../project/actionTypes';

const HISTORY_DIRECTION = {
  PAST: 'past',
  FUTURE: 'future',
};

const getHistoryForPatch = (state, patchPath) => R.pathOr(
  { [HISTORY_DIRECTION.PAST]: [], [HISTORY_DIRECTION.FUTURE]: [] },
  ['projectHistory', patchPath],
  state
);

const getCurrentPatchState = (state, patchPath) => R.compose(
  getPatchByPathUnsafe(patchPath),
  getProject
)(state);

const HISTORY_LIMIT = 50;

const moveThroughHistory = R.curry((patchPath, takeReplacementFrom, putCurrentTo, state) => {
  const currentPatchState = getCurrentPatchState(state, patchPath);
  const patchHistory = getHistoryForPatch(state, patchPath);

  if (R.isEmpty(patchHistory[takeReplacementFrom])) return state;

  const replacementPatchState = R.head(patchHistory[takeReplacementFrom]);

  return R.compose(
    R.over(
      projectLens,
      R.pipe(assocPatch(patchPath, replacementPatchState), explode)
    ),
    R.assocPath(
      ['projectHistory', patchPath],
      R.compose(
        R.over(R.lensProp(takeReplacementFrom), R.tail),
        R.over(R.lensProp(putCurrentTo), R.prepend(currentPatchState))
      )(patchHistory)
    )
  )(state);
});

const savePatchHistoty = (previousPatchState, state) => {
  const patchPath = getPatchPath(previousPatchState);
  const patchHistory = getHistoryForPatch(state, patchPath);

  return R.assocPath(
    ['projectHistory', patchPath],
    R.compose(
      R.over(
        R.lensProp(HISTORY_DIRECTION.PAST),
        R.compose(
          R.take(HISTORY_LIMIT),
          R.prepend(previousPatchState)
        )
      ),
      R.over(R.lensProp(HISTORY_DIRECTION.FUTURE), R.empty)
    )(patchHistory),
    state
  );
};

const clearPatchHistory = (patchPath, state) =>
  R.dissocPath(
    ['projectHistory', patchPath],
    state
  );

const clearAllHistory = R.over(R.lensProp('projectHistory'), R.empty);

const isDescturctiveAction = R.compose(
  isAmong([
    PROJECT_CREATE,
    PROJECT_OPEN,
    PROJECT_IMPORT,
    PROJECT_OPEN_WORKSPACE,
  ]),
  R.prop('type')
);

export default (reducer, afterHistoryNavigation = R.identity) => (state, action) => {
  switch (action.type) {
    case PATCH_HISTORY_UNDO:
      return R.compose(
        afterHistoryNavigation,
        moveThroughHistory(
          action.payload.patchPath,
          HISTORY_DIRECTION.PAST,
          HISTORY_DIRECTION.FUTURE
        )
      )(state);

    case PATCH_HISTORY_REDO:
      return R.compose(
        afterHistoryNavigation,
        moveThroughHistory(
          action.payload.patchPath,
          HISTORY_DIRECTION.FUTURE,
          HISTORY_DIRECTION.PAST
        )
      )(state);

    default: {
      const nextState = reducer(state, action);

      const previousPatchesList = R.compose(listPatches, getProject)(state);

      const currentPatches = R.compose(
        R.indexBy(getPatchPath),
        listPatches,
        getProject
      )(nextState);

      // does not include added patches, but that's ok
      const changedPreviousPatchesList = R.filter(
        prev => !R.equals(prev, currentPatches[getPatchPath(prev)]),
        previousPatchesList
      );

      if (changedPreviousPatchesList.length === 1) {
        const previousPatchState = R.head(changedPreviousPatchesList);

        const changedPatchPath = getPatchPath(previousPatchState);
        if (!currentPatches[changedPatchPath]) {
          // patch was deleted, but nothing else was affected
          return clearPatchHistory(changedPatchPath, nextState);
        }

        return savePatchHistoty(previousPatchState, nextState);
      } else if (changedPreviousPatchesList.length > 1 || isDescturctiveAction(action)) {
        // some destructive stuff happened
        return clearAllHistory(nextState);
      }

      return nextState;
    }
  }
};
