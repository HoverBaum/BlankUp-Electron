const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu
const ipc = require('electron').ipcMain
const dialog = require('electron').dialog

const menuTemplate = require('./menu')

//Reload for development when things change.
require('electron-reload')(__dirname);

ipc.on('saveDialog', (event, id, closeEditor) => {
    const options = {
        title: 'Save Markdown',
        filters: [{
            name: 'Markdown',
            extensions: ['md']
        }]
    }
    dialog.showSaveDialog(options, (filename) => {
        event.sender.send('newFilePath', filename, id, closeEditor)
    })
})

ipc.on('reallyCloseDialog', (event, id) => {
    const options = {
        type: 'warning',
        title: 'Unsaved Changes',
        message: "You have unsaved changes\n\nSave changes before closing?",
        buttons: ['Yes', 'No', 'Cancel']
    }
    dialog.showMessageBox(options, function(index) {
        event.sender.send('reallyCloseDialogAnswer', index, id)
    })
})

ipc.on('errorDialog', (event, msg) => {
	 dialog.showErrorBox('An Error Occured', msg)
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 600,
        frame: true
    })

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/index.html`)

    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    createWindow()
})

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


app.on('ready', function() {
    const menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)
})
