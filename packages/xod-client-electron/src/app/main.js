/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import {
  app,
  ipcMain,
  BrowserWindow,
} from 'electron';
import devtron from 'devtron';
import { savePatch, saveProject } from './remoteActions';

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

const onReady = () => {
  devtron.install();

  // Listen to IPC
  // @TODO: Remove repeating code

  ipcMain.on('savePatch', (event, opts) => {
    event.sender.send('savePatch:process');
    savePatch(opts.json, opts.patchId, opts.path, () => {
      event.sender.send('savePatch:complete');
    });
  });

  ipcMain.on('saveProject', (event, opts) => {
    event.sender.send('saveProject:process');
    saveProject(opts.json, opts.path, () => {
      event.sender.send('saveProject:complete');
    });
  });

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
