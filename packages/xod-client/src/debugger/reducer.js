import * as R from 'ramda';
import { renameKeys, invertMap } from 'xod-func-tools';

import {
  UPLOAD,
  INSTALL_ARDUINO_DEPENDENCIES,
  CHECK_ARDUINO_DEPENDENCIES,
  TOGGLE_DEBUGGER_PANEL,
  DEBUGGER_LOG_ADD_MESSAGES,
  DEBUGGER_LOG_CLEAR,
  DEBUGGER_LOG_START_SKIPPING_NEW_LINES,
  DEBUGGER_LOG_STOP_SKIPPING_NEW_LINES,
  DEBUGGER_LOG_TOGGLE_XOD_PROTOCOL_MESSAGES,
  DEBUG_SESSION_STARTED,
  DEBUG_SESSION_STOPPED,
  MARK_DEBUG_SESSION_OUTDATED,
  SELECT_DEBUGGER_TAB,
} from './actionTypes';

import { UPLOAD_STATUS, UPLOAD_MSG_TYPE, LOG_TAB_TYPE } from './constants';
import * as MSG from './messages';
import { STATUS } from '../utils/constants';

import {
  createSystemMessage,
  createFlasherMessage,
  createErrorMessage,
} from './utils';

import initialState from './state';

const MAX_LOG_CHARACTERS = 10000;

// =============================================================================
//
// Utils
//
// =============================================================================

const formatMessage = msg => {
  switch (msg.type) {
    case UPLOAD_MSG_TYPE.SYSTEM:
      return `=== ${msg.message} ===`;

    case UPLOAD_MSG_TYPE.ERROR: {
      const stack = msg.stack ? `\n${msg.stack}` : '';
      return `${msg.message}${stack}`;
    }

    case UPLOAD_MSG_TYPE.LOG:
      return `↘ ${msg.message}`;

    case UPLOAD_MSG_TYPE.XOD:
      return `↘ ${msg.prefix} ${msg.timecode} ${msg.nodeId} ${msg.content}`;

    default:
      return msg.message;
  }
};

const overInstallerLog = R.over(R.lensPath([LOG_TAB_TYPE.INSTALLER, 'log']));
const overCompilerLog = R.over(R.lensPath([LOG_TAB_TYPE.COMPILER, 'log']));
const overUploaderLog = R.over(R.lensPath([LOG_TAB_TYPE.UPLOADER, 'log']));
const overDebuggerLog = R.over(R.lensPath([LOG_TAB_TYPE.DEBUGGER, 'log']));

const overStageError = stage => R.over(R.lensPath([stage, 'error']));

const appendMessage = R.curry((msg, prevLog) =>
  R.compose(
    R.when(
      log => log.length > MAX_LOG_CHARACTERS,
      R.compose(
        log => `=== Older lines are truncated ===\n${log}`,
        log => log.slice(log.indexOf('\n') + 1),
        log => log.slice(-MAX_LOG_CHARACTERS)
      )
    ),
    log => {
      const formattedMessage = formatMessage(msg);
      return log === '' ? formattedMessage : `${log}\n${formatMessage(msg)}`;
    }
  )(prevLog)
);

const addMessageToDebuggerLog = R.curry((message, state) =>
  overDebuggerLog(appendMessage(message), state)
);

const addMessageListToDebuggerLog = R.curry((messages, state) =>
  overDebuggerLog(R.reduce(R.flip(appendMessage), R.__, messages), state)
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

// =============================================================================
//
// Reducer
//
// =============================================================================

export default (state = initialState, action) => {
  switch (action.type) {
    case SELECT_DEBUGGER_TAB:
      return R.assoc('currentTab', action.payload, state);
    case INSTALL_ARDUINO_DEPENDENCIES:
    case CHECK_ARDUINO_DEPENDENCIES: {
      const { type, payload, meta: { status } } = action;

      const beginMsg =
        type === INSTALL_ARDUINO_DEPENDENCIES
          ? MSG.INSTALLING_DEPENDENCIES
          : MSG.CHECKING_DEPENDENCIES;
      const successMsg =
        type === INSTALL_ARDUINO_DEPENDENCIES
          ? MSG.INSTALLING_DEPENDENCIES_SUCCESS
          : MSG.CHECKING_DEPENDENCIES_SUCCESS;

      if (status === STATUS.STARTED) {
        return R.compose(
          R.assoc('currentTab', LOG_TAB_TYPE.INSTALLER),
          R.assoc('currentStage', LOG_TAB_TYPE.INSTALLER),
          R.assoc('uploadProgress', 0),
          overInstallerLog(appendMessage(createFlasherMessage(beginMsg))),
          overInstallerLog(R.always('')),
          overCompilerLog(R.always('')),
          overUploaderLog(R.always('')),
          overDebuggerLog(R.always('')),
          overStageError(LOG_TAB_TYPE.INSTALLER)(R.always('')),
          overStageError(LOG_TAB_TYPE.COMPILER)(R.always('')),
          overStageError(LOG_TAB_TYPE.UPLOADER)(R.always('')),
          overStageError(LOG_TAB_TYPE.DEBUGGER)(R.always(''))
        )(state);
      }
      if (status === STATUS.PROGRESSED) {
        const { message, percentage } = payload;

        return R.compose(
          R.assoc('uploadProgress', percentage),
          overInstallerLog(appendMessage(createFlasherMessage(message)))
        )(state);
      }
      if (status === STATUS.SUCCEEDED) {
        return R.compose(
          R.ifElse(
            () => type === CHECK_ARDUINO_DEPENDENCIES,
            // If we just checked arduino dependencies and everything OK — continue upload
            R.compose(
              R.assoc('currentTab', LOG_TAB_TYPE.COMPILER),
              R.assoc('currentStage', LOG_TAB_TYPE.COMPILER)
            ),
            // If we installed dependencies — hide progress bar
            R.assoc('uploadProgress', null)
          ),
          overInstallerLog(appendMessage(createSystemMessage(successMsg)))
        )(state);
      }
      if (status === UPLOAD_STATUS.FAILED) {
        return R.compose(
          R.assoc('uploadProgress', null),
          overStageError(state.currentStage)(
            appendMessage(createErrorMessage(payload.message))
          ),
          showDebuggerPane
        )(state);
      }

      return state;
    }
    case UPLOAD: {
      const { payload, meta: { status } } = action;

      if (status === UPLOAD_STATUS.STARTED) {
        return R.compose(
          R.assoc('currentTab', LOG_TAB_TYPE.COMPILER),
          R.assoc('currentStage', LOG_TAB_TYPE.COMPILER),
          R.assoc('uploadProgress', 0),
          overCompilerLog(appendMessage(createFlasherMessage(MSG.TRANSPILING))),
          overCompilerLog(R.always('')),
          overUploaderLog(R.always('')),
          overDebuggerLog(R.always('')),
          overStageError(LOG_TAB_TYPE.COMPILER)(R.always('')),
          overStageError(LOG_TAB_TYPE.UPLOADER)(R.always('')),
          overStageError(LOG_TAB_TYPE.DEBUGGER)(R.always(''))
        )(state);
      }
      if (status === UPLOAD_STATUS.PROGRESSED) {
        const { message, percentage } = payload;

        return R.compose(
          R.assoc('uploadProgress', percentage),
          overCompilerLog(appendMessage(createFlasherMessage(message)))
        )(state);
      }
      if (status === UPLOAD_STATUS.SUCCEEDED) {
        return R.compose(
          R.assoc('uploadProgress', null),
          R.assoc('currentTab', LOG_TAB_TYPE.UPLOADER),
          R.assoc('currentStage', LOG_TAB_TYPE.UPLOADER),
          overUploaderLog(
            R.compose(
              appendMessage(createSystemMessage(MSG.SUCCES)),
              appendMessage(createFlasherMessage(payload.message))
            )
          )
        )(state);
      }
      if (status === UPLOAD_STATUS.FAILED) {
        return R.compose(
          R.assoc('uploadProgress', null),
          overStageError(state.currentStage)(
            appendMessage(createErrorMessage(payload.message))
          ),
          showDebuggerPane
        )(state);
      }

      return state;
    }
    case TOGGLE_DEBUGGER_PANEL:
      return R.over(R.lensProp('isVisible'), R.not, state);
    case DEBUGGER_LOG_START_SKIPPING_NEW_LINES:
      return R.assoc('isSkippingNewSerialLogLines', true, state);
    case DEBUGGER_LOG_STOP_SKIPPING_NEW_LINES:
      return R.compose(
        R.assoc('isSkippingNewSerialLogLines', false),
        R.assoc('numberOfSkippedSerialLogLines', 0),
        overDebuggerLog(
          appendMessage(
            createSystemMessage(
              `Skipped ${state.numberOfSkippedSerialLogLines} lines`
            )
          )
        )
      )(state);
    case DEBUGGER_LOG_TOGGLE_XOD_PROTOCOL_MESSAGES:
      return R.over(
        R.lensProp('isCapturingDebuggerProtocolMessages'),
        R.not,
        state
      );
    case DEBUGGER_LOG_ADD_MESSAGES: {
      const allMessages = action.payload;

      const [errorMessages, logMessages] = R.compose(
        R.partition(R.propEq('type', UPLOAD_MSG_TYPE.ERROR)),
        state.isCapturingDebuggerProtocolMessages
          ? R.identity
          : R.reject(R.propEq('type', UPLOAD_MSG_TYPE.XOD))
      )(allMessages);

      const showPanelOnErrorMessages = R.isEmpty(errorMessages)
        ? R.identity
        : showDebuggerPane;

      const addErrorMessage = R.isEmpty(errorMessages)
        ? R.identity
        : overStageError(state.currentStage)(appendMessage(errorMessages[0]));

      const addMessagesOrIncrementSkippedLines = state.isSkippingNewSerialLogLines
        ? R.over(
            R.lensProp('numberOfSkippedSerialLogLines'),
            R.add(R.length(logMessages))
          )
        : addMessageListToDebuggerLog(logMessages);

      return R.compose(
        showPanelOnErrorMessages,
        addErrorMessage,
        addMessagesOrIncrementSkippedLines,
        updateWatchNodeValues(allMessages)
      )(state);
    }
    case DEBUGGER_LOG_CLEAR:
      return R.compose(
        // TODO: should reset skip state?
        overInstallerLog(R.always('')),
        overCompilerLog(R.always('')),
        overUploaderLog(R.always('')),
        overDebuggerLog(R.always('')),
        overStageError(LOG_TAB_TYPE.INSTALLER)(R.always('')),
        overStageError(LOG_TAB_TYPE.COMPILER)(R.always('')),
        overStageError(LOG_TAB_TYPE.UPLOADER)(R.always('')),
        overStageError(LOG_TAB_TYPE.DEBUGGER)(R.always(''))
      )(state);
    case DEBUG_SESSION_STARTED:
      return R.compose(
        addMessageToDebuggerLog(action.payload.message),
        R.assoc('currentTab', LOG_TAB_TYPE.DEBUGGER),
        R.assoc('currentStage', LOG_TAB_TYPE.DEBUGGER),
        R.assoc('isSkippingNewSerialLogLines', false),
        R.assoc('numberOfSkippedSerialLogLines', 0),
        R.assoc('nodeIdsMap', invertMap(action.payload.nodeIdsMap)),
        R.assoc('isRunning', true),
        R.assoc('isOutdated', false),
        showDebuggerPane
      )(state);
    case DEBUG_SESSION_STOPPED:
      return R.compose(
        addMessageToDebuggerLog(action.payload.message),
        R.assoc('isSkippingNewSerialLogLines', false),
        R.assoc('numberOfSkippedSerialLogLines', 0),
        R.assoc('watchNodeValues', {}),
        R.assoc('nodeIdsMap', {}),
        R.assoc('isRunning', false)
      )(state);
    case MARK_DEBUG_SESSION_OUTDATED:
      return R.assoc('isOutdated', true, state);
    default:
      return state;
  }
};
