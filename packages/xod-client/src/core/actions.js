import {
  undoPatch,
  redoPatch,
} from '../project/actions';
import { getCurrentPatchPath } from '../editor/selectors';

export const undoCurrentPatch = () => (dispatch, getState) => {
  const currentPatchPath = getCurrentPatchPath(getState());
  if (currentPatchPath) dispatch(undoPatch(currentPatchPath));
};

export const redoCurrentPatch = () => (dispatch, getState) => {
  const currentPatchPath = getCurrentPatchPath(getState());
  if (currentPatchPath) dispatch(redoPatch(currentPatchPath));
};

export * from '../editor/actions';
export * from '../project/actions';
export * from '../messages/actions';
export * from '../processes/actions';
