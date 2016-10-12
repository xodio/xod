import R from 'ramda';
import { ipcRenderer } from 'electron';
import { addProcess, progressProcess, successProcess, deleteProcess, addConfirmation } from 'xod-client';

import { getWorkspace } from '../settings/selectors';
import { SAVE_PATCH, SAVE_PROJECT } from './actionTypes';

const saveProgress = ({ processId, actionType, message = 'Saving in process', percentage = 0.5 }, dispatch) => dispatch(
  progressProcess(
    processId,
    actionType,
    {
      message,
      percentage,
    }
  )
);

const saveComplete = ({ processId, actionType, message = 'Saved successfully!' }, dispatch) => {
  dispatch(successProcess(processId, actionType));
  dispatch(addConfirmation({ message }));
  setTimeout(() => {
    dispatch(deleteProcess(processId, actionType));
  }, 1000);
};

const createSaveAction = ({ eventName, actionType, messageProcess = undefined, messageComplete = undefined }) => (opts) => (dispatch, getState) => {
  const workspace = getWorkspace(getState().settings);
  const processId = dispatch(addProcess(actionType));

  ipcRenderer.once(
    `${eventName}:process`,
    () => saveProgress({ processId, actionType, messageProcess }, dispatch)
  );
  ipcRenderer.once(
    `${eventName}:complete`,
    () => saveComplete({ processId, actionType, messageComplete }, dispatch)
  );

  ipcRenderer.send(
    eventName,
    R.merge(opts, {
      path: workspace,
    })
  );
};

export const savePatch = createSaveAction({
  eventName: 'savePatch',
  actionType: SAVE_PATCH,
  messageComplete: 'Patch has been saved successfully!',
});

export const saveProject = createSaveAction({
  eventName: 'saveProject',
  actionType: SAVE_PROJECT,
  messageComplete: 'Project has been saved successfully!',
});

export default {
  savePatch,
  saveProject,
};
