import { ipcRenderer } from 'electron';
import { addProcess, progressProcess, successProcess, deleteProcess, addConfirmation } from 'xod-client';

import { getWorkspace } from '../settings/selectors';
import { SAVE_PROJECT } from './actionTypes';

export const saveProject = json => (dispatch, getState) => {
  const workspace = getWorkspace(getState().settings);
  const type = SAVE_PROJECT;

  const processId = dispatch(addProcess(type));

  ipcRenderer.once('saveProject:process', () => dispatch(
    progressProcess(
      processId,
      type,
      {
        message: 'Saving in process',
        percentage: 0.5,
      }
    )
  ));
  ipcRenderer.once('saveProject:complete', () => {
    dispatch(successProcess(processId, type));
    dispatch(addConfirmation({ message: 'Project has been saved successfully!' }));
    setTimeout(() => {
      dispatch(deleteProcess(processId, type));
    }, 1000);
  });
  ipcRenderer.send('saveProject', {
    json,
    path: workspace,
  });
};

export default {
  saveProject,
};
