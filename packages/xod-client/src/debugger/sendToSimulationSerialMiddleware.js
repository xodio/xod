import * as R from 'ramda';
import * as XP from 'xod-project';
import { formatTweakMessage } from 'xod-arduino';

import { getProject } from '../project/selectors';
import {
  isSimulationRunning,
  getInvertedDebuggerNodeIdsMap,
} from './selectors';
import * as editorSelectors from '../editor/selectors';

import { NODE_UPDATE_PROPERTY } from '../project/actionTypes';

export default ({ getState }) => next => action => {
  const state = getState();
  const result = next(action);

  if (action.type === NODE_UPDATE_PROPERTY && isSimulationRunning(state)) {
    const { id: nodeId, value, patchPath } = action.payload;
    const nodeType = R.compose(
      XP.getNodeType,
      XP.getNodeByIdUnsafe(nodeId),
      XP.getPatchByPathUnsafe(patchPath),
      getProject
    )(state);

    if (XP.isTweakPath(nodeType)) {
      const debuggerNodeId = R.compose(
        R.prop(nodeId),
        getInvertedDebuggerNodeIdsMap
      )(state);

      const msg = formatTweakMessage(nodeType, debuggerNodeId, value);
      const worker = editorSelectors.simulationWorker(state);
      worker.sendToWasm(msg);
    }
  }

  return result;
};
