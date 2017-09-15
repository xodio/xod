import R from 'ramda';

import {
  SHOW_DEBUGGER_PANEL,
  HIDE_DEBUGGER_PANEL,
  TOGGLE_DEBUGGER_PANEL,

  DEBUGGER_LOG_ADD_MESSAGE,
  DEBUGGER_LOG_CLEAR,

  DEBUG_SESSION_STARTED,
  DEBUG_SESSION_STOPPED,
} from './actionTypes';

import initialState from './state';

const addToLog = R.curry(
  (action, state) => R.over(
    R.lensProp('log'),
    R.compose(
      R.when(
        R.pipe(R.length, R.gt(R.__, 1000)),
        R.takeLast(1000)
      ),
      R.append(action.payload)
    ),
    state
  )
);

const showDebuggerPane = R.assoc('isVisible', true);
const hideDebuggerPane = R.assoc('isVisible', false);

export default (state = initialState, action) => {
  switch (action.type) {
    case SHOW_DEBUGGER_PANEL:
      return showDebuggerPane(state);
    case HIDE_DEBUGGER_PANEL:
      return hideDebuggerPane(state);
    case TOGGLE_DEBUGGER_PANEL:
      return R.over(R.lensProp('isVisible'), R.not, state);
    case DEBUGGER_LOG_ADD_MESSAGE:
      return addToLog(action, state);
    case DEBUGGER_LOG_CLEAR:
      return R.assoc('log', [], state);
    case DEBUG_SESSION_STARTED:
      return R.compose(
        addToLog(action),
        R.assoc('isRunning', true),
        showDebuggerPane
      )(state);
    case DEBUG_SESSION_STOPPED:
      return R.compose(
        addToLog(action),
        R.assoc('isRunning', false)
      )(state);
    default:
      return state;
  }
};
