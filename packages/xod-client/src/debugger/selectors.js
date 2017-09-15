import R from 'ramda';
import { createSelector } from 'reselect';

export const getDebuggerState = R.prop('debugger');

export const isDebugSession = createSelector(
  getDebuggerState,
  R.prop('isRunning')
);

export const isDebuggerVisible = createSelector(
  getDebuggerState,
  R.prop('isVisible')
);

export const getLog = createSelector(
  getDebuggerState,
  R.prop('log')
);
