import R from 'ramda';
import { createSelector } from 'reselect';
import {
  getCurrentTabId,
  getBreadcrumbChunks,
  getBreadcrumbActiveIndex,
} from '../editor/selectors';
import { DEBUGGER_TAB_ID } from '../editor/constants';

export const getDebuggerState = R.prop('debugger');

export const isDebugSession = R.compose(R.prop('isRunning'), getDebuggerState);

export const isDebuggerVisible = R.compose(
  R.prop('isVisible'),
  getDebuggerState
);

export const getLog = R.compose(R.prop('log'), getDebuggerState);

export const getDebuggerNodeIdsMap = R.compose(
  R.prop('nodeIdsMap'),
  getDebuggerState
);

export const getWatchNodeValues = R.compose(
  R.prop('watchNodeValues'),
  getDebuggerState
);

export const getWatchNodeValuesForCurrentPatch = createSelector(
  [
    getCurrentTabId,
    getWatchNodeValues,
    getBreadcrumbChunks,
    getBreadcrumbActiveIndex,
  ],
  (tabId, nodeValues, chunks, activeIndex) => {
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
  }
);
