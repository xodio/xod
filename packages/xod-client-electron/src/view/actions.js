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
  openProject,
} from 'xod-client';

import { getWorkspace } from '../settings/selectors';
import * as ActionType from './actionTypes';

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

const processCompleted = ({
  processId,
  actionType,
  payload,
}, dispatch) => {
  dispatch(successProcess(processId, actionType, { data: payload }));

  setTimeout(() => {
    dispatch(deleteProcess(processId, actionType));
  }, 1000);
};

const processFailed = ({
  processId,
  actionType,
  payload,
}, dispatch) => {
  dispatch(failProcess(processId, actionType, { data: payload }));

  setTimeout(() => {
    dispatch(deleteProcess(processId, actionType));
  }, 1000);
};

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
}) => opts => (dispatch, getState) => {
  const workspace = getWorkspace(getState().settings);
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
      console.error(err); // we won't see these errors otherwise

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

  ipcRenderer.send(
    eventName,
    R.merge(opts, {
      workspace,
    })
  );
};

export const loadProjectList = createAsyncAction({
  eventName: 'loadProjectList',
  actionType: ActionType.LOAD_PROJECT_LIST,
  messages: {
    process: 'Receiving of project list...',
    complete: 'Project list has been received!',
    error: 'Failed to load project list.',
  },
  notify: false,
});

export const loadProject = createAsyncAction({
  eventName: 'loadProject',
  actionType: ActionType.LOAD_PROJECT,
  messages: {
    process: 'Loading project...',
    complete: 'Project has been loaded!',
    error: 'Failed to load project.',
  },
  onComplete: (data, dispatch) => {
    dispatch(openProject(data));
  },
});

export const saveProject = createAsyncAction({
  eventName: 'saveProject',
  actionType: ActionType.SAVE_PROJECT,
  messages: {
    process: 'Saving in progress...',
    complete: 'Project has been saved successfully!',
    error: 'Failed to save project.',
  },
});

export default {
  saveProject,
  loadProject,
  loadProjectList,
};
