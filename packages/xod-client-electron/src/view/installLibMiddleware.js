import client from 'xod-client';
import { ipcRenderer } from 'electron';

import { INSTALL_LIBRARIES } from '../shared/events';

export default () => next => action => {
  if (action.type === client.INSTALL_LIBRARIES_COMPLETE) {
    ipcRenderer.send(INSTALL_LIBRARIES, {
      request: action.payload.request,
      projects: action.payload.projects,
    });
  }

  return next(action);
};
