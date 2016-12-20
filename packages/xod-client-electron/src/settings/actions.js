import path from 'path';
import {
  SET_WORKSPACE,
  CHANGE_WORKSPACE,
} from './actionTypes';
import { createAsyncAction } from '../view/actions';
import { updateNodeTypes } from 'xod-client';

export const setWorkspace = newPath => ({
  type: SET_WORKSPACE,
  payload: path.resolve(newPath),
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
