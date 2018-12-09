let argsCmd = process.argv.slice(2);
let timerTime = parseInt(argsCmd[0]);

const electron = require('electron');

const {app} = electron;

const {BrowserWindow} = electron;

const Menu = electron.Menu;

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
   width: 1280,
   height: 620,
   frame: true,//borders
   resizable: true})

  mainWindow.loadURL(`file://${__dirname}/app/index.html`);
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });
}


app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

