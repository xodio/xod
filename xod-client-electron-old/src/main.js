import electron from 'electron';

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;


// Prevent collecting by GC.
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({ width: 800, height: 600 });

  mainWindow.loadURL('file://' + __dirname + '/editor/index.html');
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  // For MacOS: Close whole application on closing window.
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // For MacOS: Prevent creating window twice by clicking on it in the Dock.
  if (mainWindow === null) {
    createWindow();
  }
});
