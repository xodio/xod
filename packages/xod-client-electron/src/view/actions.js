import { ipcRenderer } from 'electron';
import { getWorkspace } from '../settings/selectors';

export const saveProject = (json) => (dispatch, getState) => {
  const workspace = getWorkspace(getState().settings);

  ipcRenderer.on('saveProject:process', () => {});
  ipcRenderer.once('saveProject:complete', () => {
    dispatch({
      type: 'SAVE_COMPLETE',
    });
  });
  ipcRenderer.send('saveProject', {
    json,
    path: workspace,
  });
};
