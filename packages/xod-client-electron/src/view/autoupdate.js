import R from 'ramda';
import * as EVENTS from '../shared/events';

// :: ipcRenderer -> AppContainer -> ()
export const subscribeAutoUpdaterEvents = (ipcRenderer, App) => {
  ipcRenderer.on(EVENTS.APP_UPDATE_ERROR, (event, error) => {
    console.error(error); // eslint-disable-line no-console
    App.setState(R.assoc('downloadProgressPopup_error', error.message));
  });
  ipcRenderer.on(EVENTS.APP_UPDATE_AVAILABLE, (event, info) => {
    console.log('Update available: ', info); // eslint-disable-line no-console
    App.props.actions.addNotification(
      `New version (${info.version}) of XOD\u00A0IDE is available`,
      [
        {
          id: 'downloadAndInstall',
          text: 'Download & Install',
        },
        {
          id: 'dismiss',
          text: 'Skip',
        },
      ],
      true
    );
  });
  ipcRenderer.on(EVENTS.APP_UPDATE_PROGRESS, (event, progress) => {
    console.log('Downloading update: ', progress); // eslint-disable-line no-console
  });
  ipcRenderer.on(EVENTS.APP_UPDATE_DOWNLOADED, (event, info) => {
    console.log('Update downloaded. Will be restarted soon!', info); // eslint-disable-line no-console
  });
  ipcRenderer.on(EVENTS.APP_UPDATE_DOWNLOAD_STARTED, () => {
    console.log('Download has been started!'); // eslint-disable-line no-console
  });
};

export const downloadUpdate = ipcRenderer => {
  ipcRenderer.send(EVENTS.APP_UPDATE_DOWNLOAD_REQUEST);
};
