import {
  undoPatch,
  redoPatch,
} from '../project/actions';
import { getCurrentPatchId } from '../editor/selectors';

export const undoCurrentPatch = () => (dispatch, getState) => {
  const currentPatchId = getCurrentPatchId(getState());
  if (currentPatchId) dispatch(undoPatch(currentPatchId));
};

export const redoCurrentPatch = () => (dispatch, getState) => {
  const currentPatchId = getCurrentPatchId(getState());
  if (currentPatchId) dispatch(redoPatch(currentPatchId));
};

export * from '../editor/actions';
export * from '../project/actions';
export * from '../messages/actions';
export * from '../processes/actions';
