import * as AT from './actionTypes';

export const toggleDebugger = () => ({
  type: AT.TOGGLE_DEBUGGER_PANEL,
});

export const addMessagesToDebuggerLog = messages => ({
  type: AT.DEBUGGER_LOG_ADD_MESSAGES,
  payload: messages,
});

export const clearDebuggerLog = () => ({
  type: AT.DEBUGGER_LOG_CLEAR,
});

export const startSkippingNewLogLines = () => ({
  type: AT.DEBUGGER_LOG_START_SKIPPING_NEW_LINES,
});

export const stopSkippingNewLogLines = () => ({
  type: AT.DEBUGGER_LOG_STOP_SKIPPING_NEW_LINES,
});

export const toggleCapturingDebuggerProtocolMessages = () => ({
  type: AT.DEBUGGER_LOG_TOGGLE_XOD_PROTOCOL_MESSAGES,
});

export const selectDebuggerTab = tab => ({
  type: AT.SELECT_DEBUGGER_TAB,
  payload: tab,
});

export const startDebuggerSession = (
  message,
  nodeIdsMap,
  currentPatchPath
) => ({
  type: AT.DEBUG_SESSION_STARTED,
  payload: {
    message,
    nodeIdsMap,
    patchPath: currentPatchPath,
  },
});

export const startSerialSession = message => ({
  type: AT.SERIAL_SESSION_STARTED,
  payload: {
    message,
  },
});

export const stopDebuggerSession = message => ({
  type: AT.DEBUG_SESSION_STOPPED,
  payload: {
    message,
  },
});

export const drillDown = (patchPath, nodeId) => ({
  type: AT.DEBUG_DRILL_DOWN,
  payload: {
    patchPath,
    nodeId,
  },
});

export const markDebugSessionOutdated = () => ({
  type: AT.MARK_DEBUG_SESSION_OUTDATED,
});

export const sendToSerial = line => ({
  type: AT.LINE_SENT_TO_SERIAL,
  payload: line,
});
