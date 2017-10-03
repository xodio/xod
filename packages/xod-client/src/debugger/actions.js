import * as AT from './actionTypes';

export const showDebugger = () => ({
  type: AT.SHOW_DEBUGGER_PANEL,
});

export const hideDebugger = () => ({
  type: AT.HIDE_DEBUGGER_PANEL,
});

export const toggleDebugger = () => ({
  type: AT.TOGGLE_DEBUGGER_PANEL,
});

export const addMessagesToDebuggerLog = message => ({
  type: AT.DEBUGGER_LOG_ADD_MESSAGES,
  payload: message,
});

export const clearDebuggerLog = () => ({
  type: AT.DEBUGGER_LOG_CLEAR,
});

export const startDebuggerSession = (message, nodeIdsMap) => ({
  type: AT.DEBUG_SESSION_STARTED,
  payload: {
    message,
    nodeIdsMap,
  },
});

export const stopDebuggerSession = message => ({
  type: AT.DEBUG_SESSION_STOPPED,
  payload: {
    message,
  },
});
