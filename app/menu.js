const dialog = require('electron').dialog
const electron = require('electron')

let template = [{
    label: 'File',
    submenu: [{
        label: 'New',
        accelerator: ' CmdOrCtrl+N',
        click: function(item, focusedWindow) {
            focusedWindow.webContents.send('newFile')
        }
    }, {
        label: 'Open',
        accelerator: 'CmdOrCtrl+O',
        click: function(item, focusedWindow) {
            dialog.showOpenDialog({
                properties: ['openFile', 'multiSelections'],
                filters: [{
                    name: 'Markdown',
                    extensions: ['md']
                }]
            }, function(files) {
                if (files) focusedWindow.webContents.send('openFiles', files)
            })
        }
    }, {
        label: 'Close current',
        accelerator: 'CmdOrCtrl+W',
        click: function(item, focusedWindow) {
            focusedWindow.webContents.send('closeCurrentEditor')
        }
    }, {
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        click: function(item, focusedWindow) {
            focusedWindow.webContents.send('saveCurrentEditor')
        }
    }]
}, {
    label: 'Edit',
    submenu: [{
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo'
    }, {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo'
    }, {
        type: 'separator'
    }, {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut'
    }, {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
    }, {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste'
    }, {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectall'
    }]
}, {
    label: 'View',
    submenu: [{
        label: 'Toggle Full Screen',
        accelerator: (function() {
            if (process.platform === 'darwin') {
                return 'Ctrl+Command+F'
            } else {
                return 'F11'
            }
        })(),
        click: function(item, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
            }
        }
    }, {
        label: 'Focus next',
        accelerator: 'CmdOrCtrl+Tab',
        click: function(item, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.webContents.send('focusNextEditor')
            }
        }
    }, {
        label: 'Focus previous',
        accelerator: 'CmdOrCtrl+Shift+Tab',
        click: function(item, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.webContents.send('focusPreviousEditor')
            }
        }
    }, {
        label: 'Toggle preview',
        accelerator: 'CmdOrCtrl+M',
        click: function(item, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.webContents.send('togglePreview')
            }
        }
    }, {
        label: 'Developer',
        submenu: [{
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: function(item, focusedWindow) {
                if (focusedWindow) {
                    focusedWindow.reload()
                }
            }
        }, {
            label: 'Toggle Developer Tools',
            accelerator: (function() {
                if (process.platform === 'darwin') {
                    return 'Alt+Command+I'
                } else {
                    return 'Ctrl+Shift+I'
                }
            })(),
            click: function(item, focusedWindow) {
                if (focusedWindow) {
                    focusedWindow.toggleDevTools()
                }
            }
        }]
    }]
}, {
    label: 'Help',
    role: 'help',
    submenu: [{
        label: 'Learn More',
        click: function() {
            electron.shell.openExternal('https://github.com/HoverBaum/BlankUp-Electron')
        }
    }, {
        label: 'Syntax example',
        click: function(item, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.webContents.send('showSyntaxExample')
            }
        }
    }]
}]


if (process.platform === 'darwin') {
    const name = electron.app.getName()
    template.unshift({
        label: name,
        submenu: [{
            label: `About ${name}`,
            role: 'about'
        }, {
            type: 'separator'
        }, {
            label: 'Services',
            role: 'services',
            submenu: []
        }, {
            type: 'separator'
        }, {
            label: `Hide ${name}`,
            accelerator: 'Command+H',
            role: 'hide'
        }, {
            label: 'Hide Others',
            accelerator: 'Command+Alt+H',
            role: 'hideothers'
        }, {
            label: 'Show All',
            role: 'unhide'
        }, {
            type: 'separator'
        }, {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: function() {
                app.quit()
            }
        }]
    })

    // Window menu.
    template[3].submenu.push({
        type: 'separator'
    }, {
        label: 'Bring All to Front',
        role: 'front'
    })
}

module.exports = template
