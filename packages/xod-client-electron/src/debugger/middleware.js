import client from 'xod-client';
import { ipcRenderer } from 'electron';
import { sendStopDebuggerSession } from './ipcActions';
import { DEBUG_SESSION_STOPPED_ON_CHANGE } from '../shared/messages';

export default store => next => (action) => {
  const state = store.getState();
  const isDebugSession = client.isDebugSession(state);
  const prevProject = client.getProject(state);

  const result = next(action);

  const newProject = client.getProject(store.getState());

  if (isDebugSession && prevProject !== newProject) {
    sendStopDebuggerSession(ipcRenderer);
    store.dispatch(client.addError(DEBUG_SESSION_STOPPED_ON_CHANGE));
  }

  return result;
};
