import * as R from 'ramda';
import { ipcRenderer } from 'electron';
import { basename } from 'path';

import { getProjectName } from 'xod-project';
import {
  addProcess,
  progressProcess,
  successProcess,
  deleteProcess,
  failProcess,
  addConfirmation,
  addNotification,
  addError,
  SAVE_ALL,
  getProject,
  getLastSavedProject,
  updateProjectMeta,
  deriveProjectName,
} from 'xod-client';
import * as EVENTS from '../shared/events';
import * as MESSAGES from '../shared/messages';
import { STATES, getEventNameWithState } from '../shared/eventStates';

// =============================================================================
//
// Process utils
//
// =============================================================================

const processProgressed = (
  {
    processId,
    actionType,
    message = 'Process in progress',
    progress = 0.5,
    payload = {},
  },
  dispatch
) =>
  dispatch(
    progressProcess(
      processId,
      actionType,
      R.merge(
        {
          message,
          progress,
        },
        payload
      )
    )
  );

const finishProcess = action => (
  { processId, actionType, payload },
  dispatch
) => {
  dispatch(action(processId, actionType, { data: payload }));
  setTimeout(() => {
    dispatch(deleteProcess(processId, actionType));
  }, 1000);
};

const processCompleted = finishProcess(successProcess);

const processFailed = finishProcess(failProcess);

const createAsyncAction = ({
  eventName,
  actionType,
  messages: {
    process: processMsg,
    complete: completeMsg,
    error: errorMsg,
  } = {},
  notify = true,
  silent = false,
  onComplete = R.always(undefined),
  onError = R.always(undefined),
}) => data => (dispatch, getState) => {
  let processId = null;

  if (!silent) {
    processId = dispatch(addProcess(actionType));

    if (processMsg) {
      ipcRenderer.once(
        getEventNameWithState(eventName, STATES.PROCESS),
        (sender, payload) =>
          processProgressed(
            { processId, actionType, message: processMsg, notify, payload },
            dispatch
          )
      );
    }
  }

  ipcRenderer.once(
    getEventNameWithState(eventName, STATES.COMPLETE),
    (sender, payload) => {
      if (!silent) {
        processCompleted({ processId, actionType, payload }, dispatch);
      }
      if (notify) {
        dispatch(addConfirmation(completeMsg));
      }

      onComplete(payload, dispatch, getState);
    }
  );

  ipcRenderer.once(
    getEventNameWithState(eventName, STATES.ERROR),
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
        processFailed({ processId, actionType, payload: err }, dispatch);
      }
      if (notify) {
        const extendedErrorMessage = R.mergeWith(
          (a, b) => `${a}. ${b}`,
          errorMsg,
          { note: err.message }
        );
        dispatch(addError(extendedErrorMessage));
      }

      onError(err, dispatch, getState);
    }
  );

  ipcRenderer.send(eventName, data);
};

// =============================================================================
//
// Actions
//
// =============================================================================

const saveAllOnFs = createAsyncAction({
  eventName: EVENTS.SAVE_ALL,
  actionType: SAVE_ALL,
  messages: {
    process: null,
    complete: MESSAGES.SAVE_ALL_SUCCEED,
    error: MESSAGES.SAVE_ALL_FAILED,
  },
  onComplete: (payload, dispatch, getState) => {
    // After save:
    // if project name equals to the old derived one
    // and file path is changed — show the message
    if (!payload.updateProjectPath) return;

    const projectName = R.compose(getProjectName, getProject, getState)();
    const newDerivedProjectName = deriveProjectName(
      basename(payload.projectPath)
    );
    const prevDerivedProjectName = deriveProjectName(
      basename(payload.prevProjectPath)
    );
    if (
      projectName === prevDerivedProjectName &&
      projectName !== newDerivedProjectName
    )
      dispatch(
        addNotification(
          MESSAGES.dontForgetToChangeProjectName(
            projectName,
            newDerivedProjectName
          )
        )
      );
  },
});

export const saveAll = payload => (dispatch, getState) => {
  // Before save: update project name if needed
  const projectName = R.compose(getProjectName, getProject, getState)();
  if (payload.updateProjectPath && R.isEmpty(projectName)) {
    dispatch(
      updateProjectMeta({
        name: deriveProjectName(basename(payload.projectPath)),
      })
    );
  }
  // Save
  const state = getState();
  const newProject = getProject(state);
  const oldProject = getLastSavedProject(state);
  return dispatch(
    saveAllOnFs({
      oldProject,
      newProject,
      ...payload,
    })
  );
};

export default {
  saveAll,
};
