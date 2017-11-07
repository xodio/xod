import R from 'ramda';
import { renameKeys, invertMap } from 'xod-func-tools';

import {
  SHOW_DEBUGGER_PANEL,
  HIDE_DEBUGGER_PANEL,
  TOGGLE_DEBUGGER_PANEL,
  DEBUGGER_LOG_ADD_MESSAGES,
  DEBUGGER_LOG_CLEAR,
  DEBUG_SESSION_STARTED,
  DEBUG_SESSION_STOPPED,
} from './actionTypes';

import initialState from './state';

const MAX_LOG_MESSAGES = 1000;

// =============================================================================
//
// Utils
//
// =============================================================================

const addToLog = R.over(R.lensProp('log'));

const addMessageToLog = R.curry((message, state) =>
  addToLog(R.compose(R.takeLast(MAX_LOG_MESSAGES), R.append(message)), state)
);

const addMessageListToLog = R.curry((messages, state) =>
  addToLog(
    R.compose(R.takeLast(MAX_LOG_MESSAGES), R.concat(R.__, messages)),
    state
  )
);

const updateWatchNodeValues = R.curry((messageList, state) => {
  const MapToRekey = R.prop('nodeIdsMap', state);
  return R.compose(
    newValues =>
      R.over(R.lensProp('watchNodeValues'), R.merge(R.__, newValues), state),
    renameKeys(MapToRekey),
    R.map(R.compose(R.prop('content'), R.last)),
    R.groupBy(R.prop('nodeId')),
    R.filter(R.propEq('type', 'xod'))
  )(messageList);
});

const showDebuggerPane = R.assoc('isVisible', true);
const hideDebuggerPane = R.assoc('isVisible', false);

// =============================================================================
//
// Reducer
//
// =============================================================================

export default (state = initialState, action) => {
  switch (action.type) {
    case SHOW_DEBUGGER_PANEL:
      return showDebuggerPane(state);
    case HIDE_DEBUGGER_PANEL:
      return hideDebuggerPane(state);
    case TOGGLE_DEBUGGER_PANEL:
      return R.over(R.lensProp('isVisible'), R.not, state);
    case DEBUGGER_LOG_ADD_MESSAGES:
      return R.compose(
        addMessageListToLog(action.payload),
        updateWatchNodeValues(action.payload)
      )(state);
    case DEBUGGER_LOG_CLEAR:
      return R.assoc('log', [], state);
    case DEBUG_SESSION_STARTED:
      return R.compose(
        addMessageToLog(action.payload.message),
        R.assoc('nodeIdsMap', invertMap(action.payload.nodeIdsMap)),
        R.assoc('isRunning', true),
        showDebuggerPane
      )(state);
    case DEBUG_SESSION_STOPPED:
      return R.compose(
        addMessageToLog(action.payload.message),
        R.assoc('watchNodeValues', {}),
        R.assoc('nodeIdsMap', {}),
        R.assoc('isRunning', false)
      )(state);
    default:
      return state;
  }
};
