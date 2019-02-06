import client from 'xod-client';
import { ipcRenderer } from 'electron';
import { sendStopDebuggerSession } from './ipcActions';
import { DEBUG_SESSION_STOPPED_ON_TAB_CLOSE } from '../shared/messages';

export default store => next => action => {
  const state = store.getState();
  const isSerialDebugRunning = client.isSerialDebugRunning(state);
  const result = next(action);

  // Stop debug session if Debugger tab is closed
  if (
    isSerialDebugRunning &&
    action.type === client.TAB_CLOSE &&
    action.payload.id === 'debugger'
  ) {
    sendStopDebuggerSession(ipcRenderer);
    store.dispatch(client.addError(DEBUG_SESSION_STOPPED_ON_TAB_CLOSE));
  }

  return result;
};
