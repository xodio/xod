import {
  SET_WORKSPACE,
  CHECK_WORKSPACE,
  CHANGE_WORKSPACE,
} from './actionTypes';
import { createAsyncAction } from '../view/actions';
import { updateNodeTypes } from 'xod-client';

export const setWorkspace = newPath => ({
  type: SET_WORKSPACE,
  payload: newPath,
});

export const checkWorkspace = createAsyncAction({
  eventName: 'checkWorkspace',
  actionType: CHECK_WORKSPACE,
  notify: false,
  silent: true,
  onComplete: (data, dispatch) => {
    if (data.valid && data.nodeTypes) {
      dispatch(updateNodeTypes(data.nodeTypes));
      return;
    }

    // ask user to define workspace
    dispatch(setWorkspace(null));
  },
});

export const changeWorkspace = createAsyncAction({
  eventName: 'changeWorkspace',
  actionType: CHANGE_WORKSPACE,
  messages: {
    complete: 'Workspace has been changed!',
  },
  silent: true,
  onComplete: (data, dispatch) => {
    dispatch(setWorkspace(data.path));
    dispatch(updateNodeTypes(data.nodeTypes));
  },
});

export default {
  setWorkspace,
  changeWorkspace,
};
