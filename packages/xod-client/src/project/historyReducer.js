import R from 'ramda';
import { lensPatch, assocPatch, rightOrInitial, getPatchPath } from 'xod-project';

import { getProjectV2 } from './selectors';

import {
  PATCH_HISTORY_SAVE,
  PATCH_HISTORY_UNDO,
  PATCH_HISTORY_REDO,
  PATCH_HISTORY_CLEAR_FOR_PATCH,
  PATCH_HISTORY_CLEAR_ALL,
  PROJECT_LOAD_DATA,
} from './actionTypes';

const HISTORY_DIRECTION = {
  PAST: 'past',
  FUTURE: 'future',
};

const getHistoryForPatch = (state, patchId) => R.pathOr(
  { [HISTORY_DIRECTION.PAST]: [], [HISTORY_DIRECTION.FUTURE]: [] },
  ['projectHistory', patchId],
  state
);

const getCurrentPatchState = (state, patchId) => R.compose(
  R.view(lensPatch(patchId)),
  getProjectV2
)(state);

const HISTORY_LIMIT = 50;

const moveThroughHistory = (patchId, takeReplacementFrom, putCurrentTo, state) => {
  const currentPatchState = getCurrentPatchState(state, patchId);
  const patchHistory = getHistoryForPatch(state, patchId);

  if (R.isEmpty(patchHistory[takeReplacementFrom])) return state;

  const replacementPatchState = R.head(patchHistory[takeReplacementFrom]);

  return R.compose(
    R.over(
      R.lensProp('projectV2'), // TODO
      rightOrInitial(
        assocPatch(patchId, replacementPatchState)
      )
    ),
    R.assocPath(
      ['projectHistory', patchId],
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

      const patchId = getPatchPath(previousPatchState);
      const patchHistory = getHistoryForPatch(state, patchId);

      return R.assocPath(
        ['projectHistory', patchId],
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
        ['projectHistory', action.payload.patchId],
        state
      );
    }

    case PROJECT_LOAD_DATA:
    case PATCH_HISTORY_CLEAR_ALL: {
      return R.over(
        R.lensProp('projectHistory'),
        R.empty,
        state
      );
    }

    case PATCH_HISTORY_UNDO: {
      return moveThroughHistory(
        action.payload.patchId,
        HISTORY_DIRECTION.PAST,
        HISTORY_DIRECTION.FUTURE,
        state
      );
    }

    case PATCH_HISTORY_REDO: {
      return moveThroughHistory(
        action.payload.patchId,
        HISTORY_DIRECTION.FUTURE,
        HISTORY_DIRECTION.PAST,
        state
      );
    }

    default:
      return state;
  }
};
