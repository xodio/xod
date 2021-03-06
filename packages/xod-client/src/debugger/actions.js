import { maybeProp } from 'xod-func-tools';

import * as AT from './actionTypes';
import { tetheringInetChunksToSend } from './selectors';

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

export const stopSkippingNewLogLines = (force = true) => ({
  type: AT.DEBUGGER_LOG_STOP_SKIPPING_NEW_LINES,
  payload: { force },
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
  nodePinKeysMap,
  tableLogNodeIds,
  pinsAffectedByErrorRaisers,
  patchPath,
  globals,
  tetheringInetNodeId
) => ({
  type: AT.DEBUG_SESSION_STARTED,
  payload: {
    message,
    nodeIdsMap,
    nodePinKeysMap,
    tableLogNodeIds,
    pinsAffectedByErrorRaisers,
    patchPath,
    globals,
    tetheringInetNodeId,
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

export const tetheringInetCreated = (nodeId, sender, transmitter) => ({
  type: AT.TETHERING_INET_CREATED,
  payload: {
    nodeId,
    sender,
    transmitter,
  },
});

export const tetheringInetChunksAdded = chunk => ({
  type: AT.TETHERING_INET_CHUNKS_ADDED,
  payload: chunk,
});

export const tetheringInetChunkSent = () => (dispatch, getState) => {
  const chunksToSend = tetheringInetChunksToSend(getState());
  dispatch({
    type: AT.TETHERING_INET_CHUNK_SENT,
  });
  return maybeProp(0, chunksToSend);
};

export const tetheringInetClearChunks = () => ({
  type: AT.TETHERING_INET_CLEAR_CHUNKS,
});
