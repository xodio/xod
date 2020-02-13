import * as R from 'ramda';
import * as XP from 'xod-project';
import client from 'xod-client';
import { foldMaybe } from 'xod-func-tools';
import { formatTweakMessage } from 'xod-arduino';
import { ipcRenderer } from 'electron';

import { DEBUG_SERIAL_SEND } from '../shared/events';

export default ({ getState }) => next => action => {
  const state = getState();
  const result = next(action);

  if (
    action.type === client.LINE_SENT_TO_SERIAL &&
    (client.isSerialDebugRunning(state) || client.isSerialSessionRunning(state))
  ) {
    ipcRenderer.send(DEBUG_SERIAL_SEND, action.payload);
  }

  const isTweakActionType =
    action.type === client.NODE_PROPERTY_UPDATED ||
    action.type === client.TWEAK_PULSE_SENT ||
    action.type === client.NODE_PROPERTY_UPDATING;
  if (isTweakActionType && client.isSerialDebugRunning(state)) {
    const { id: nodeId, value = '', patchPath } = action.payload;
    const nodeType = R.compose(
      XP.getNodeType,
      XP.getNodeByIdUnsafe(nodeId),
      XP.getPatchByPathUnsafe(patchPath),
      client.getProject
    )(state);

    if (XP.isTweakPath(nodeType)) {
      const nodeIdPath = R.compose(
        foldMaybe(nodeId, R.concat(R.__, nodeId)),
        client.getCurrentChunksPath
      )(state);
      const debuggerNodeId = R.compose(
        R.prop(nodeIdPath),
        client.getInvertedDebuggerNodeIdsMap
      )(state);

      const globals = client.getStoredGlobals(state);

      // If value looks like a global literal — get value from the stored globals
      const valueToSend = R.when(
        R.startsWith('='),
        R.compose(R.propOr(value, R.__, globals), R.tail)
      )(value);

      ipcRenderer.send(
        DEBUG_SERIAL_SEND,
        formatTweakMessage(nodeType, debuggerNodeId, valueToSend)
      );
    }
  }

  return result;
};
