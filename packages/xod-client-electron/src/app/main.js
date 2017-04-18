import R from 'ramda';
import {
  app,
  ipcMain,
  BrowserWindow,
} from 'electron';
import devtron from 'devtron';
import settings from 'electron-settings';
import { resolvePath } from 'xod-fs';
import { saveProject, loadProjectList, loadProject, changeWorkspace, checkWorkspace } from './remoteActions';
import { checkArduinoIde, installPav, findPort, doTranspileForArduino, uploadToArduino } from './uploadActions';

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
}

const setDefaultSettings = () => {
  if (R.isEmpty(settings.getAll())) {
    settings.setAll({
      arduino: {
        paths: {
          // TODO: Add paths for other OS
          ide: '/Applications/Arduino.app/Contents/MacOS/Arduino',
          packages: resolvePath('~/Library/Arduino15/packages/'),
        },
        pavs: [],
      },
    });
  }
};

const subscribeRemoteAction = (processName, remoteAction) => {
  ipcMain.on(processName, (event, opts) => {
    event.sender.send(`${processName}:process`);
    remoteAction(opts,
      (data) => { event.sender.send(`${processName}:complete`, data); }
    );
  });
};

const onReady = () => {
  devtron.install();
  setDefaultSettings();

  // TODO: Replace actionTypes with constants (after removing webpack from this package)
  subscribeRemoteAction('saveProject', saveProject);
  subscribeRemoteAction('loadProjectList', loadProjectList);
  subscribeRemoteAction('loadProject', loadProject);
  subscribeRemoteAction('checkWorkspace', checkWorkspace);
  subscribeRemoteAction('changeWorkspace', changeWorkspace);

  ipcMain.on('UPLOAD_TO_ARDUINO',
    (event, payload) => {
      let code;
      let port;

      let percentage = 0;
      function reply(data) {
        percentage += data.percentage;
        event.sender.send('UPLOAD_TO_ARDUINO', R.merge(data, { percentage }));
      }

      doTranspileForArduino(payload, reply)
      .then((transpiledCode) => { code = transpiledCode; })
      .then(() => findPort(payload.pab, reply))
      .then((foundPort) => { port = foundPort; })
      .then(() => checkArduinoIde(settings.get('arduino.paths'), reply))
      .then(() => installPav(payload.pab, reply))
      .then(() => uploadToArduino(payload.pab, port, code, reply))
      .catch(reply);
    }
  );

  createWindow();
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
