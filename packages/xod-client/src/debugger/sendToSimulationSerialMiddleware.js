import * as R from 'ramda';
import * as XP from 'xod-project';
import { foldMaybe } from 'xod-func-tools';
import { formatTweakMessage } from 'xod-arduino';

import { getProject } from '../project/selectors';
import {
  isSimulationRunning,
  getCurrentChunksPath,
  getInvertedDebuggerNodeIdsMap,
  getStoredGlobals,
} from './selectors';
import * as editorSelectors from '../editor/selectors';

import { NODE_UPDATE_PROPERTY } from '../project/actionTypes';
import { TWEAK_PULSE_SENT } from '../editor/actionTypes';

export default ({ getState }) => next => action => {
  const state = getState();
  const result = next(action);

  const isTweakActionType =
    action.type === NODE_UPDATE_PROPERTY || action.type === TWEAK_PULSE_SENT;
  if (isTweakActionType && isSimulationRunning(state)) {
    const { id: nodeId, value, patchPath } = action.payload;
    const nodeType = R.compose(
      XP.getNodeType,
      XP.getNodeByIdUnsafe(nodeId),
      XP.getPatchByPathUnsafe(patchPath),
      getProject
    )(state);

    if (XP.isTweakPath(nodeType)) {
      const nodeIdPath = R.compose(
        foldMaybe(nodeId, R.concat(R.__, nodeId)),
        getCurrentChunksPath
      )(state);
      const debuggerNodeId = R.compose(
        R.prop(nodeIdPath),
        getInvertedDebuggerNodeIdsMap
      )(state);

      const globals = getStoredGlobals(state);

      // If value looks like a global literal — get value from the stored globals
      const valueToSend = R.when(
        R.startsWith('='),
        R.compose(R.propOr(value, R.__, globals), R.tail)
      )(value);

      const msg = formatTweakMessage(nodeType, debuggerNodeId, valueToSend);
      const worker = editorSelectors.simulationWorker(state);
      worker.sendToWasm(msg);
    }
  }

  return result;
};
