import client from 'xod-client';
import { ipcRenderer } from 'electron';

import { INSTALL_LIBRARY } from '../shared/events';

export default () => next => (action) => {
  if (action.type === client.INSTALL_LIBRARY_COMPLETE) {
    ipcRenderer.send(
      INSTALL_LIBRARY,
      {
        request: action.payload.request,
        xodball: action.payload.xodball,
      }
    );
  }

  return next(action);
};
