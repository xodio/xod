import client from 'xod-client';
import { ipcRenderer } from 'electron';
import { sendStopDebuggerSession } from './ipcActions';
import {
  DEBUG_SESSION_STOPPED_ON_CHANGE,
  DEBUG_SESSION_STOPPED_ON_TAB_CLOSE,
} from '../shared/messages';

export default store => next => (action) => {
  const state = store.getState();
  const isDebugSession = client.isDebugSession(state);
  const prevProject = client.getProject(state);
  const result = next(action);

  const newProject = client.getProject(store.getState());

  // Stop debug session if something changed in the Project
  if (isDebugSession && prevProject !== newProject) {
    sendStopDebuggerSession(ipcRenderer);
    store.dispatch(client.addError(DEBUG_SESSION_STOPPED_ON_CHANGE));
  }

  // Stop debug session if Debugger tab is closed
  if (
    isDebugSession &&
    action.type === client.TAB_CLOSE &&
    action.payload.id === 'debugger'
  ) {
    sendStopDebuggerSession(ipcRenderer);
    store.dispatch(client.addError(DEBUG_SESSION_STOPPED_ON_TAB_CLOSE));
  }

  return result;
};
