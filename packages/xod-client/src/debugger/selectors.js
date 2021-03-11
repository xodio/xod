import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { foldMaybe, isAmong, memoizeOnlyLast } from 'xod-func-tools';
import { createSelector } from 'reselect';
import {
  getCurrentTabId,
  getBreadcrumbChunks,
  getBreadcrumbActiveIndex,
} from '../editor/selectors';
import { DEBUGGER_TAB_ID } from '../editor/constants';
import { SESSION_TYPE } from './constants';

import { createMemoizedSelector } from '../utils/selectorTools';
import { getTableLogSourceLabels, removeLastNodeIdInChain } from './utils';

export const getDebuggerState = R.prop('debugger');

export const isDebugSession = R.compose(
  R.propSatisfies(
    isAmong([SESSION_TYPE.DEBUG, SESSION_TYPE.SIMULATON]),
    'activeSession'
  ),
  getDebuggerState
);

export const isSessionActive = R.compose(
  ds => ds.activeSession !== SESSION_TYPE.NONE,
  getDebuggerState
);

export const isSerialDebugRunning = R.compose(
  R.propEq('activeSession', SESSION_TYPE.DEBUG),
  getDebuggerState
);

export const isSerialSessionRunning = R.compose(
  R.propEq('activeSession', SESSION_TYPE.SERIAL),
  getDebuggerState
);

export const isSimulationRunning = R.compose(
  R.propEq('activeSession', SESSION_TYPE.SIMULATON),
  getDebuggerState
);

export const isPreparingSimulation = R.compose(
  R.prop('isPreparingSimulation'),
  getDebuggerState
);

export const isSimulationAbortable = R.either(
  isPreparingSimulation,
  isSimulationRunning
);

export const isDebugSessionOutdated = R.compose(
  R.prop('isOutdated'),
  getDebuggerState
);

export const isSkippingNewSerialLogLines = R.compose(
  R.prop('isSkippingNewSerialLogLines'),
  getDebuggerState
);

export const getNumberOfSkippedSerialLogLines = R.compose(
  R.prop('numberOfSkippedSerialLogLines'),
  getDebuggerState
);

export const isCapturingDebuggerProtocolMessages = R.compose(
  R.prop('isCapturingDebuggerProtocolMessages'),
  getDebuggerState
);

export const getCurrentDebuggerTab = R.compose(
  R.prop('currentTab'),
  getDebuggerState
);

export const getLogForCurrentTab = createSelector(
  [getDebuggerState, getCurrentDebuggerTab],
  (debuggerState, currentTab) => R.path([currentTab, 'log'], debuggerState)
);

export const getErrorForCurrentTab = createSelector(
  [getDebuggerState, getCurrentDebuggerTab],
  (debuggerState, currentTab) => R.path([currentTab, 'error'], debuggerState)
);

export const getDebuggerNodeIdsMap = R.compose(
  R.prop('nodeIdsMap'),
  getDebuggerState
);

export const getInvertedDebuggerNodeIdsMap = R.compose(
  memoizeOnlyLast(R.invertObj),
  getDebuggerNodeIdsMap
);

export const getWatchNodeValues = R.compose(
  R.prop('watchNodeValues'),
  getDebuggerState
);

export const geTableLogValues = R.compose(
  R.prop('tableLogValues'),
  getDebuggerState
);

export const getUploadProgress = R.compose(
  Maybe,
  R.prop('uploadProgress'),
  getDebuggerState
);

// :: Number -> [BreadcrumbChunk] -> String
const getChunksPath = R.curry((activeIndex, chunks) =>
  R.compose(
    R.join('~'),
    R.append(''),
    R.pluck('nodeId'),
    R.tail, // remove first cause it's entry patch without any nodeId
    R.take(activeIndex + 1)
  )(chunks)
);

export const getCurrentChunksPath = createSelector(
  [getCurrentTabId, getBreadcrumbChunks, getBreadcrumbActiveIndex],
  (maybeTabId, chunks, activeIndex) =>
    R.chain(tabId => {
      if (tabId !== DEBUGGER_TAB_ID) return Maybe.Nothing();
      return Maybe.Just(getChunksPath(activeIndex, chunks));
    }, maybeTabId)
);

// :: Number -> NodeId -> Map NodeId Any -> Map NodeId Any
const filterOutValuesForCurrentPatch = R.curry(
  (activeIndex, nodeIdPath, nodeIdValuesMap) =>
    R.compose(
      R.fromPairs,
      R.when(
        () => activeIndex !== 0,
        R.map(R.over(R.lensIndex(0), R.replace(nodeIdPath, '')))
      ),
      R.filter(
        R.compose(
          R.ifElse(
            () => activeIndex === 0,
            R.complement(R.contains('~')),
            R.startsWith(nodeIdPath)
          ),
          R.nth(0)
        )
      ),
      R.toPairs
    )(nodeIdValuesMap)
);

export const getInteractiveNodeValuesForCurrentPatch = createSelector(
  [
    getCurrentTabId,
    getWatchNodeValues,
    geTableLogValues,
    getBreadcrumbChunks,
    getBreadcrumbActiveIndex,
  ],
  (maybeTabId, nodeMap, tableLogs, chunks, activeIndex) =>
    foldMaybe(
      {},
      tabId => {
        if (tabId !== DEBUGGER_TAB_ID) return {};

        const nodeIdPath = getChunksPath(activeIndex, chunks);

        const watchNodeValues = filterOutValuesForCurrentPatch(
          activeIndex,
          nodeIdPath,
          nodeMap
        );

        const tableLogValues = R.compose(
          R.map(sheets => {
            const lastSheetIndex = sheets.length > 0 ? sheets.length - 1 : 0;
            return `Sheet #${sheets.length}, Row #${
              sheets[lastSheetIndex].length
            }`;
          }),
          filterOutValuesForCurrentPatch(activeIndex, nodeIdPath),
          // `tsv-log`, which is actually stores the data, encapsulated
          // inside `table-log`, which label should be replaced with
          // this value. So we have to cut the latest nodeId part from
          // keys of table log values map
          R.fromPairs,
          R.map(R.over(R.lensIndex(0), removeLastNodeIdInChain)),
          R.toPairs
        )(tableLogs);

        return R.merge(watchNodeValues, tableLogValues);
      },
      maybeTabId
    )
);

export const getInteractiveErroredNodePins = R.compose(
  R.prop('interactiveErroredNodePins'),
  getDebuggerState
);

export const getPinsAffectedByErrorRaisers = R.compose(
  R.prop('pinsAffectedByErrorRaisers'),
  getDebuggerState
);

export const getPinsAffectedByErrorRaisersForCurrentChunk = createMemoizedSelector(
  [
    getCurrentTabId,
    getPinsAffectedByErrorRaisers,
    getBreadcrumbChunks,
    getBreadcrumbActiveIndex,
  ],
  [R.equals, R.equals, R.equals, R.equals],
  (maybeTabId, pinPairs, chunks, activeIndex) =>
    foldMaybe(
      {},
      tabId => {
        if (tabId !== DEBUGGER_TAB_ID) return {};
        const nodeIdPath = getChunksPath(activeIndex, chunks);

        return R.map(
          R.map(
            R.compose(
              R.map(R.over(R.lensIndex(1), R.replace(nodeIdPath, ''))),
              R.filter(R.compose(R.startsWith(nodeIdPath), R.nth(1)))
            )
          )
        )(pinPairs);
      },
      maybeTabId
    )
);

export const getInteractiveErroredNodePinsForCurrentChunk = createMemoizedSelector(
  [
    getCurrentTabId,
    getInteractiveErroredNodePins,
    getBreadcrumbChunks,
    getBreadcrumbActiveIndex,
  ],
  [R.equals, R.equals, R.equals, R.equals],
  (maybeTabId, nodeMap, chunks, activeIndex) =>
    foldMaybe(
      {},
      tabId => {
        if (tabId !== DEBUGGER_TAB_ID) return {};
        const nodeIdPath = getChunksPath(activeIndex, chunks);

        return R.compose(
          // Merge with the original to make possible to easily mark affected nodes
          R.merge(nodeMap),
          R.fromPairs,
          // Generate pairs for all chunks
          // E.G.
          // [['a~b~c', 10]] => [['a', 10], ['a~b', 10], ['a~b~c', 10]]
          R.reduce((acc, [origPath, errCode]) => {
            const nodePathChunks = R.split('~', origPath);
            const allPaths = R.addIndex(R.map)((_, idx) =>
              R.compose(R.append(errCode), R.of, R.join('~'), R.take(idx + 1))(
                nodePathChunks
              )
            )(nodePathChunks);
            return R.concat(allPaths, acc);
          }, []),
          R.when(
            () => activeIndex !== 0,
            R.map(R.over(R.lensIndex(0), R.replace(nodeIdPath, '')))
          ),
          R.filter(R.compose(R.startsWith(nodeIdPath), R.nth(0))),
          R.toPairs
        )(nodeMap);
      },
      maybeTabId
    )
);

export const getStoredGlobals = R.compose(R.prop('globals'), getDebuggerState);

export const tetheringInetNodeId = R.compose(
  R.path(['tetheringInet', 'nodeId']),
  getDebuggerState
);

export const tetheringInetSender = R.compose(
  R.path(['tetheringInet', 'sender']),
  getDebuggerState
);

export const tetheringInetChunksToSend = R.compose(
  R.path(['tetheringInet', 'chunksToSend']),
  getDebuggerState
);

export const tetheringInetTransmitter = R.compose(
  R.path(['tetheringInet', 'transmitter']),
  getDebuggerState
);

// =============================================================================
//
// Table log
//
// =============================================================================

export const getTableLogValues = R.compose(
  R.prop('tableLogValues'),
  getDebuggerState
);

export const getTableLogSourcesRaw = R.compose(
  R.prop('tableLogSources'),
  getDebuggerState
);

// :: State -> [{ nodeId: NodeId, label: String }]
export const getTableLogSources = state =>
  R.compose(
    R.unnest,
    R.values,
    R.mapObjIndexed(getTableLogSourceLabels(state.project)),
    getTableLogSourcesRaw
  )(state);

export const getTableLogsByNodeId = R.curry((nodeId, state) =>
  R.compose(R.propOr([], nodeId), getTableLogValues)(state)
);
