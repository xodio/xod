import {
  CREATE_WORKSPACE_REQUESTED,
  SWITCH_WORKSPACE_REQUESTED,
  CREATE_WORKSPACE,
  SWITCH_WORKSPACE,
} from './actionTypes';

export const requestCreateWorkspace = (path, force) => ({
  type: CREATE_WORKSPACE_REQUESTED,
  payload: { path, force },
});
export const requestSwitchWorkspace = opts => ({
  type: SWITCH_WORKSPACE_REQUESTED,
  payload: opts,
});

export const createWorkspace = path => ({
  type: CREATE_WORKSPACE,
  payload: { path },
});
export const switchWorkspace = path => ({
  type: SWITCH_WORKSPACE,
  payload: { path },
});
