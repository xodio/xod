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

export const isDebuggerVisible = R.compose(
  R.prop('isVisible'),
  getDebuggerState
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

export const getWatchNodeValuesForCurrentPatch = createSelector(
  [
    getCurrentTabId,
    getWatchNodeValues,
    getBreadcrumbChunks,
    getBreadcrumbActiveIndex,
  ],
  (maybeTabId, nodeMap, chunks, activeIndex) =>
    foldMaybe(
      {},
      tabId => {
        if (tabId !== DEBUGGER_TAB_ID) return {};

        const nodeIdPath = getChunksPath(activeIndex, chunks);

        return R.compose(
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
        )(nodeMap);
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
