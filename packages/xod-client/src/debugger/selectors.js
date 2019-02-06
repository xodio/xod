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

export const getWatchNodeValuesForCurrentPatch = createSelector(
  [
    getCurrentTabId,
    getWatchNodeValues,
    getBreadcrumbChunks,
    getBreadcrumbActiveIndex,
  ],
  (maybeTabId, nodeValues, chunks, activeIndex) =>
    foldMaybe(
      {},
      tabId => {
        if (tabId !== DEBUGGER_TAB_ID) return {};

        const nodeIdPath = R.compose(
          R.join('~'),
          R.append(''),
          R.map(R.prop('nodeId')),
          R.tail, // remove first cause it's entry patch without any nodeId
          R.take(activeIndex + 1)
        )(chunks);

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
                R.complement(R.contains)('~'),
                R.startsWith(nodeIdPath)
              ),
              R.nth(0)
            )
          ),
          R.toPairs
        )(nodeValues);
      },
      maybeTabId
    )
);
