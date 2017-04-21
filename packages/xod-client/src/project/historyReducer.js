import R from 'ramda';
import { lensPatch, assocPatch, getPatchPath } from 'xod-project';
import { explode } from 'xod-func-tools';

import { getProject, projectLens } from './selectors';

import {
  PATCH_HISTORY_SAVE,
  PATCH_HISTORY_UNDO,
  PATCH_HISTORY_REDO,
  PATCH_HISTORY_CLEAR_FOR_PATCH,
  PATCH_HISTORY_CLEAR_ALL,
  PROJECT_CREATE,
  PROJECT_OPEN,
  PROJECT_IMPORT,
  PROJECT_OPEN_WORKSPACE,
} from './actionTypes';

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
  R.view(lensPatch(patchPath)),
  getProject
)(state);

const HISTORY_LIMIT = 50;

const moveThroughHistory = (patchPath, takeReplacementFrom, putCurrentTo, state) => {
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
};

export default (state, action) => {
  switch (action.type) {
    case PATCH_HISTORY_SAVE: {
      const { previousPatchState } = action.payload;

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
    }

    case PATCH_HISTORY_CLEAR_FOR_PATCH: {
      return R.dissocPath(
        ['projectHistory', action.payload.patchPath],
        state
      );
    }

    case PROJECT_CREATE:
    case PROJECT_OPEN:
    case PROJECT_IMPORT:
    case PROJECT_OPEN_WORKSPACE:
    case PATCH_HISTORY_CLEAR_ALL: {
      return R.over(
        R.lensProp('projectHistory'),
        R.empty,
        state
      );
    }

    case PATCH_HISTORY_UNDO: {
      return moveThroughHistory(
        action.payload.patchPath,
        HISTORY_DIRECTION.PAST,
        HISTORY_DIRECTION.FUTURE,
        state
      );
    }

    case PATCH_HISTORY_REDO: {
      return moveThroughHistory(
        action.payload.patchPath,
        HISTORY_DIRECTION.FUTURE,
        HISTORY_DIRECTION.PAST,
        state
      );
    }

    default:
      return state;
  }
};
