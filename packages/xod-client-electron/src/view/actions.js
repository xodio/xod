import R from 'ramda';
import { ipcRenderer } from 'electron';
import { addProcess, progressProcess, successProcess, deleteProcess, addConfirmation, loadProjectOnlyFromJSON } from 'xod-client';

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
  onComplete = R.always(undefined),
}, dispatch) => {
  dispatch(successProcess(processId, actionType, { data: payload }));

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
  } = {},
  notify = true,
  silent = false,
  onComplete = R.always(undefined),
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
          { processId, actionType, payload, onComplete },
          dispatch
        );
      }
      if (notify) {
        dispatch(addConfirmation({ message: completeMsg }));
      }

      onComplete(payload, dispatch);
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
  },
  notify: false,
});

export const loadProject = createAsyncAction({
  eventName: 'loadProject',
  actionType: ActionType.LOAD_PROJECT,
  messages: {
    process: 'Loading project...',
    complete: 'Project has been loaded!',
  },
  onComplete: (data, dispatch) => {
    const json = JSON.stringify(data); // @TODO: Remove excessive json stringify->parse (?)
    dispatch(loadProjectOnlyFromJSON(json));
  },
});

export const savePatch = createAsyncAction({
  eventName: 'savePatch',
  actionType: ActionType.SAVE_PATCH,
  messages: {
    process: 'Saving in progress...',
    complete: 'Patch has been saved successfully!',
  },
});

export const saveProject = createAsyncAction({
  eventName: 'saveProject',
  actionType: ActionType.SAVE_PROJECT,
  messages: {
    process: 'Saving in progress...',
    complete: 'Project has been saved successfully!',
  },
});

export default {
  savePatch,
  saveProject,
  loadProject,
  loadProjectList,
};
