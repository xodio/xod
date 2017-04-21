import R from 'ramda';
import {
  app,
  ipcMain,
  BrowserWindow,
} from 'electron';
import devtron from 'devtron';
import { tapP } from 'xod-func-tools';

import * as settings from './settings';
import {
  saveProject,
  loadProjectList,
  loadProject,
  changeWorkspace,
  checkWorkspace,
} from './remoteActions';
import {
  checkArduinoIde,
  installPav,
  getInstalledPAV,
  findPort,
  doTranspileForArduino,
  uploadToArduino,
} from './uploadActions';
import * as messages from './messages';

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
  settings.setDefaults();

  // TODO: Replace actionTypes with constants (after removing webpack from this package)
  subscribeRemoteAction('saveProject', saveProject);
  subscribeRemoteAction('loadProjectList', loadProjectList);
  subscribeRemoteAction('loadProject', loadProject);
  subscribeRemoteAction('checkWorkspace', checkWorkspace);
  subscribeRemoteAction('changeWorkspace', changeWorkspace);

  ipcMain.on('UPLOAD_TO_ARDUINO',
    (event, payload) => {
      // Messages
      const send = status => R.compose(
        data => (arg) => { event.sender.send('UPLOAD_TO_ARDUINO', data); return arg; },
        R.assoc(status, true),
        (message, percentage, errCode = null) => ({
          success: false,
          progress: false,
          failure: false,
          errorCode: errCode,
          message,
          percentage,
        })
      );
      const sendSuccess = send('success');
      const sendProgress = send('progress');
      const sendFailure = send('failure');
      const convertAndSendError = err => R.compose(
        msg => sendFailure(msg, 0, err.errorCode)(),
        R.propOr(err.message, R.__, messages),
        R.prop('errorCode')
      )(err);

      const updateArduinoPaths = ({ ide, packages }) => R.compose(
        settings.save,
        settings.setArduinoPackages(packages),
        settings.setArduinoIDE(ide),
        settings.load
      )();

      const getArduinoPaths = R.compose(
        R.applySpec({
          ide: settings.getArduinoIDE,
          packages: settings.getArduinoPackages,
        }),
        settings.load
      );

      const listInstalledPAVs = R.compose(
        settings.listPAVs,
        settings.load
      );
      const appendPAV = R.curry(
        (pav, allSettings) => R.compose(
          settings.assocPAVs(R.__, allSettings),
          R.unless(
            R.find(R.equals(pav)),
            R.append(pav)
          ),
          settings.listPAVs
        )(allSettings)
      );
      const savePAV = pav => R.compose(
        settings.save,
        appendPAV(pav),
        settings.load
      )();

      R.pipeP(
        doTranspileForArduino,
        sendProgress(messages.CODE_TRANSPILED, 10),
        code => findPort().then(port => ({ code, port })),
        sendProgress(messages.PORT_FOUND, 15),
        tapP(
          () => checkArduinoIde(getArduinoPaths(), process.platform)
            .then(updateArduinoPaths)
        ),
        sendProgress(messages.IDE_FOUND, 20),
        tapP(
          () => installPav(payload.pab)
            .catch(() => getInstalledPAV(payload.pab, listInstalledPAVs()))
            .then(R.tap(savePAV))
        ),
        sendProgress(messages.TOOLCHAIN_INSTALLED, 30),
        ({ code, port }) => uploadToArduino(payload.pab, port, code),
        stdout => sendSuccess(stdout, 100)()
      )(payload).catch(convertAndSendError);
    }
  );
  ipcMain.on('SET_ARDUINO_IDE',
    (event, payload) => {
      R.compose(
        () => event.sender.send('SET_ARDUINO_IDE', {
          code: 0,
          message: messages.ARDUINO_PATH_CHANGED,
        }),
        settings.save,
        settings.setArduinoIDE(payload.path),
        settings.load
      )();
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
