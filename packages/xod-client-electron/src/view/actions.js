import R from 'ramda';
import { ipcRenderer } from 'electron';
import { addProcess, progressProcess, successProcess, deleteProcess, addConfirmation } from 'xod-client';

import { getWorkspace } from '../settings/selectors';
import { SAVE_PATCH, SAVE_PROJECT } from './actionTypes';

const progressSave = ({ processId, actionType, message = 'Saving in process', progress = 0.5 }, dispatch) => dispatch(
  progressProcess(
    processId,
    actionType,
    {
      message,
      progress,
    }
  )
);

const completeSave = ({ processId, actionType, message = 'Saved successfully!' }, dispatch) => {
  dispatch(successProcess(processId, actionType));
  dispatch(addConfirmation({ message }));
  setTimeout(() => {
    dispatch(deleteProcess(processId, actionType));
  }, 1000);
};

const createSaveAction = ({
  eventName,
  actionType,
  processMessage,
  processComplete,
}) => opts => (dispatch, getState) => {
  const workspace = getWorkspace(getState().settings);
  const processId = dispatch(addProcess(actionType));

  ipcRenderer.once(
    `${eventName}:process`,
    () => progressSave({ processId, actionType, message: processMessage }, dispatch)
  );
  ipcRenderer.once(
    `${eventName}:complete`,
    () => completeSave({ processId, actionType, message: processComplete }, dispatch)
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
  processComplete: 'Patch has been saved successfully!',
});

export const saveProject = createSaveAction({
  eventName: 'saveProject',
  actionType: SAVE_PROJECT,
  processComplete: 'Project has been saved successfully!',
});

export default {
  savePatch,
  saveProject,
};
