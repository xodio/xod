import * as R from 'ramda';
import * as EVENTS from '../shared/events';
import { updateAvailableMessage } from '../shared/messages';

export const UPDATE_IDE_MESSAGE_ID = 'updateIde';

// :: ipcRenderer -> AppContainer -> ()
export const subscribeAutoUpdaterEvents = (ipcRenderer, App) => {
  ipcRenderer.on(EVENTS.APP_UPDATE_ERROR, (event, error) => {
    console.error(error); // eslint-disable-line no-console
    App.setState(R.assoc('downloadProgressPopup_error', error.message));
  });
  ipcRenderer.on(EVENTS.APP_UPDATE_AVAILABLE, (event, info) => {
    console.log('Update available: ', info); // eslint-disable-line no-console
    App.props.actions.addNotification(
      updateAvailableMessage(info.version),
      UPDATE_IDE_MESSAGE_ID
    );
  });
  ipcRenderer.on(EVENTS.APP_UPDATE_PROGRESS, (event, progress) => {
    console.log('Downloading update: ', progress); // eslint-disable-line no-console
  });
  ipcRenderer.on(EVENTS.APP_UPDATE_DOWNLOADED, (event, info) => {
    console.log('Update downloaded. Will be restarted soon!', info); // eslint-disable-line no-console
  });
  ipcRenderer.on(EVENTS.APP_UPDATE_DOWNLOAD_STARTED, () => {
    App.setState(R.assoc('downloadProgressPopup', true));
    console.log('Download has been started!'); // eslint-disable-line no-console
  });
};

export const downloadUpdate = ipcRenderer => {
  ipcRenderer.send(EVENTS.APP_UPDATE_DOWNLOAD_REQUEST);
};
