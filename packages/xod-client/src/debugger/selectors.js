import R from 'ramda';

export const getDebuggerState = R.prop('debugger');

export const isDebugSession = R.compose(
  R.prop('isRunning'),
  getDebuggerState
);

export const isDebuggerVisible = R.compose(
  R.prop('isVisible'),
  getDebuggerState
);

export const getLog = R.compose(
  R.prop('log'),
  getDebuggerState
);

export const getDebuggerNodeIdsMap = R.compose(
  R.prop('nodeIdsMap'),
  getDebuggerState
);

export const getWatchNodeValues = R.compose(
  R.prop('watchNodeValues'),
  getDebuggerState
);
