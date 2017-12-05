import client from 'xod-client';
import { ipcRenderer } from 'electron';

import { UPDATE_IDE_MESSAGE_ID, downloadUpdate } from './autoupdate';

export default () => next => (action) => {
  if (action.type === client.MESSAGE_BUTTON_CLICKED && action.payload === UPDATE_IDE_MESSAGE_ID) {
    downloadUpdate(ipcRenderer);
  }

  return next(action);
};
