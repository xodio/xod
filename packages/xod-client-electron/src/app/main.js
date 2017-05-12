import {
  app,
  ipcMain,
  BrowserWindow,
} from 'electron';

import * as WA from './workspaceActions';
import { errorToPlainObject } from './utils';
import {
  uploadToArduinoHandler,
  setArduinoIDEHandler,
} from './arduinoActions';
import * as settings from './settings';
import * as EVENTS from '../shared/events';

app.setName('xod');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    title: 'XOD IDE',
    show: false,
  });
  win.maximize();
  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/../index.html`);

  // Open the DevTools.
  // win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  win.on('ready-to-show', win.show);
}

const subscribeToRemoteAction = (processName, remoteAction) => {
  ipcMain.on(processName, (event, data) => {
    event.sender.send(`${processName}:process`);
    remoteAction(event, data)
      .then((result) => { event.sender.send(`${processName}:complete`, result); })
      .catch((err) => { event.sender.send(`${processName}:error`, errorToPlainObject(err)); });
  });
};

const onReady = () => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line global-require
    require('devtron').install();
  }
  settings.setDefaults();

  subscribeToRemoteAction(EVENTS.SAVE_PROJECT, WA.subscribeSaveProject);

  WA.subscribeToWorkspaceEvents(ipcMain);
  ipcMain.on('UPLOAD_TO_ARDUINO', uploadToArduinoHandler);
  ipcMain.on('SET_ARDUINO_IDE', setArduinoIDEHandler);

  createWindow();
  win.webContents.on('did-finish-load', () => {
    WA.prepareWorkspaceOnLaunch((eventName, data) => win.webContents.send(eventName, data));
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', onReady);

// Quit when all windows are closed.
app.on('window-all-closed', app.quit);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});
