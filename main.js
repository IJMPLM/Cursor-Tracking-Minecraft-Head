const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const remoteMain = require('@electron/remote/main');
remoteMain.initialize();
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 100,
    minWidth: 150,
    minHeight: 50,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    movable: true,
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

remoteMain.enable(mainWindow.webContents);
  mainWindow.loadFile('index.html');
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true);

  // Start sending mouse position to renderer
  const robot = require('robotjs');
  setInterval(() => {
    const pos = robot.getMousePos();
    mainWindow.webContents.send('mouse-pos', pos);
  }, 50);
}


app.whenReady().then(createWindow);

ipcMain.on('quit-app', () => {
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
