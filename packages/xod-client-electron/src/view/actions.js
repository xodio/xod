import { ipcRenderer } from 'electron';
import { getWorkspace } from '../settings/selectors';

export const saveProject = (pojo) => (dispatch, getState) => {
  const workspace = getWorkspace(getState().settings);

  ipcRenderer.once('saveProject:complete', () => {
    dispatch({
      type: 'SAVE_COMPLETE',
    });
  });
  ipcRenderer.send('saveProject', {
    pojo,
    path: workspace,
  });
};
