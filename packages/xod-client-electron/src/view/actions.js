import R from 'ramda';
import { ipcRenderer } from 'electron';
import {
  addProcess,
  progressProcess,
  successProcess,
  deleteProcess,
  failProcess,
  addConfirmation,
  addError,
} from 'xod-client';
import * as EVENTS from '../shared/events';

import * as ActionType from './actionTypes';

// =============================================================================
//
// Process utils
//
// =============================================================================

const processProgressed = ({
    processId,
    actionType,
    message = 'Process in progress',
    progress = 0.5,
    payload = {},
  }, dispatch) => dispatch(
    progressProcess(
      processId,
      actionType,
      R.merge({
        message,
        progress,
      }, payload)
    )
);

const finishProcess = action => ({
    processId,
    actionType,
    payload,
  }, dispatch) => {
  dispatch(action(processId, actionType, { data: payload }));
  setTimeout(() => {
    dispatch(deleteProcess(processId, actionType));
  }, 1000);
};

const processCompleted = finishProcess(successProcess);

const processFailed = finishProcess(failProcess);

export const createAsyncAction = ({
    eventName,
    actionType,
    messages: {
      process: processMsg = '',
      complete: completeMsg = '',
      error: errorMsg = '',
    } = {},
    notify = true,
    silent = false,
    onComplete = R.always(undefined),
    onError = R.always(undefined),
  }) => data => (dispatch) => {
    let processId = null;

    if (!silent) {
      processId = dispatch(addProcess(actionType));

      if (processMsg) {
        ipcRenderer.once(
          `${eventName}:process`,
          (sender, payload) => processProgressed(
            { processId, actionType, message: processMsg, notify, payload },
            dispatch
          )
        );
      }
    }

    ipcRenderer.once(
      `${eventName}:complete`,
      (sender, payload) => {
        if (!silent) {
          processCompleted(
            { processId, actionType, payload },
            dispatch
          );
        }
        if (notify) {
          dispatch(addConfirmation(completeMsg));
        }

        onComplete(payload, dispatch);
      }
    );

    ipcRenderer.once(
      `${eventName}:error`,
      (sender, err) => {
        // eslint-disable-next-line no-console
        console.error(
          `Unhandled error returned in event '${eventName}' (started by action '${actionType}'). See details:`,
          {
            eventName,
            actionType,
            data,
            error: err,
          }
        );

        if (!silent) {
          processFailed(
            { processId, actionType, payload: err },
            dispatch
          );
        }
        if (notify) {
          dispatch(addError(errorMsg));
        }

        onError(err, dispatch);
      }
    );

    ipcRenderer.send(eventName, data);
  };

// =============================================================================
//
// Actions
//
// =============================================================================

export const saveProject = createAsyncAction({
  eventName: EVENTS.SAVE_PROJECT,
  actionType: ActionType.SAVE_PROJECT,
  messages: {
    process: 'Saving in progress...',
    complete: 'Project has been saved successfully!',
    error: 'Failed to save project.',
  },
});

export default {
  saveProject,
};
