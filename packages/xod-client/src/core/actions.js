import { undoPatch, redoPatch } from '../project/actions';
import { SHOW_CODE_REQUESTED } from './actionTypes';
import { getCurrentPatchPath } from '../editor/selectors';
import { isInput } from '../utils/browser';

export const undoCurrentPatch = () => (dispatch, getState) => {
  if (isInput(document.activeElement)) return;

  getCurrentPatchPath(getState()).map(currentPatchPath =>
    dispatch(undoPatch(currentPatchPath))
  );
};

export const redoCurrentPatch = () => (dispatch, getState) => {
  if (isInput(document.activeElement)) return;

  getCurrentPatchPath(getState()).map(currentPatchPath =>
    dispatch(redoPatch(currentPatchPath))
  );
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
