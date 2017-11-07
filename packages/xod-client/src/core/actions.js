import { undoPatch, redoPatch } from '../project/actions';
import { SHOW_CODE_REQUESTED } from './actionTypes';
import { getCurrentPatchPath } from '../editor/selectors';

export const undoCurrentPatch = () => (dispatch, getState) => {
  const currentPatchPath = getCurrentPatchPath(getState());
  if (currentPatchPath) dispatch(undoPatch(currentPatchPath));
};

export const redoCurrentPatch = () => (dispatch, getState) => {
  const currentPatchPath = getCurrentPatchPath(getState());
  if (currentPatchPath) dispatch(redoPatch(currentPatchPath));
};

export const showCode = code => ({
  type: SHOW_CODE_REQUESTED,
  payload: { code },
});

export * from '../user/actions';
export * from '../editor/actions';
export * from '../project/actions';
export * from '../projectBrowser/actions';
export * from '../messages/actions';
export * from '../processes/actions';
export * from '../popups/actions';
export * from '../debugger/actions';
