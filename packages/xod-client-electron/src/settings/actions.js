import { openWorkspace } from 'xod-client';

import {
  SET_WORKSPACE,
  CHECK_WORKSPACE,
  CHANGE_WORKSPACE,
} from './actionTypes';
import { createAsyncAction } from '../view/actions';

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
    if (data.valid && data.libs) {
      dispatch(openWorkspace(data.libs));
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
    dispatch(openWorkspace(data.libs));
  },
});

export default {
  setWorkspace,
  changeWorkspace,
};
