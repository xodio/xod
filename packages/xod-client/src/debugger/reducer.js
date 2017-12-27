import R from 'ramda';
import { renameKeys, invertMap } from 'xod-func-tools';

import {
  UPLOAD,

  TOGGLE_DEBUGGER_PANEL,

  DEBUGGER_LOG_ADD_MESSAGES,
  DEBUGGER_LOG_CLEAR,

  DEBUG_SESSION_STARTED,
  DEBUG_SESSION_STOPPED,
} from './actionTypes';

import { UPLOAD_STATUS, UPLOAD_MSG_TYPE } from './constants';
import * as MSG from './messages';

import initialState from './state';

const MAX_LOG_MESSAGES = 1000;

// =============================================================================
//
// Utils
//
// =============================================================================

const createSystemMessage = message => ({
  type: UPLOAD_MSG_TYPE.SYSTEM,
  message,
});
const createFlasherMessage = message => ({
  type: UPLOAD_MSG_TYPE.FLASHER,
  message,
});
const createErrorMessage = message => ({
  type: UPLOAD_MSG_TYPE.ERROR,
  message,
});

const overDebugLog = R.over(R.lensProp('log'));
const overUploadLog = R.over(R.lensProp('uploadLog'));

const addMessageToLog = R.curry(
  (message, state) => overDebugLog(
    R.compose(
      R.takeLast(MAX_LOG_MESSAGES),
      R.append(message)
    ),
    state
  )
);

const addMessageListToLog = R.curry(
  (messages, state) => overDebugLog(
    R.compose(
      R.takeLast(MAX_LOG_MESSAGES),
      R.concat(R.__, messages)
    ),
    state
  )
);

const updateWatchNodeValues = R.curry(
  (messageList, state) => {
    const MapToRekey = R.prop('nodeIdsMap', state);
    return R.compose(
      newValues => R.over(
        R.lensProp('watchNodeValues'),
        R.merge(R.__, newValues),
        state
      ),
      renameKeys(MapToRekey),
      R.map(R.compose(
        R.prop('content'),
        R.last
      )),
      R.groupBy(R.prop('nodeId')),
      R.filter(R.propEq('type', 'xod'))
    )(messageList);
  }
);

const showDebuggerPane = R.assoc('isVisible', true);

const splitMessage = R.compose(
  R.reject(R.isEmpty),
  R.split('\n')
);

// =============================================================================
//
// Reducer
//
// =============================================================================

export default (state = initialState, action) => {
  switch (action.type) {
    case UPLOAD: {
      const {
        payload,
        meta: { status },
      } = action;

      if (status === UPLOAD_STATUS.STARTED) {
        return R.compose(
          R.assoc('uploadProgress', 0),
          R.assoc('log', []),
          R.assoc('uploadLog', [
            createSystemMessage(MSG.TRANSPILING),
          ])
        )(state);
      }
      if (status === UPLOAD_STATUS.PROGRESSED) {
        const { message, percentage } = payload;

        return R.compose(
          R.assoc('uploadProgress', percentage),
          overUploadLog(R.append(createSystemMessage(message))),
        )(state);
      }
      if (status === UPLOAD_STATUS.SUCCEEDED) {
        const messages = R.compose(
          R.append(createSystemMessage(MSG.SUCCES)),
          R.map(createFlasherMessage),
          splitMessage,
        )(payload.message);

        return R.compose(
          R.assoc('uploadProgress', null),
          overUploadLog(R.concat(R.__, messages)),
        )(state);
      }
      if (status === UPLOAD_STATUS.FAILED) {
        const messages = R.compose(
          R.map(createErrorMessage),
          splitMessage
        )(payload.message);

        return R.compose(
          R.assoc('uploadProgress', null),
          overUploadLog(R.concat(R.__, messages)),
          showDebuggerPane
        )(state);
      }

      return state;
    }
    case TOGGLE_DEBUGGER_PANEL:
      return R.over(R.lensProp('isVisible'), R.not, state);
    case DEBUGGER_LOG_ADD_MESSAGES: {
      const showPanelOnErrorMessages = R.any(R.propEq('type', UPLOAD_MSG_TYPE.ERROR), action.payload)
        ? showDebuggerPane
        : R.identity;

      return R.compose(
        showPanelOnErrorMessages,
        addMessageListToLog(action.payload),
        updateWatchNodeValues(action.payload)
      )(state);
    }
    case DEBUGGER_LOG_CLEAR:
      return R.compose(
        R.assoc('log', []),
        R.assoc('uploadLog', [])
      )(state);
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
