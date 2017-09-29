const ipc = require('electron').ipcRenderer

module.exports = function handleIPCMessages (state, emitter) {
  ipc.on('newFile', () => emitter.emit('newEditor', {}))

  ipc.on('showSyntaxExample', () => emitter.emit('showSyntaxExample'))

  ipc.on('saveCurrentEditor', () => emitter.emit('editor:saveCurrent'))

  ipc.on('focusNextEditor', () => emitter.emit('editor:focusNext'))

  ipc.on('focusPreviousEditor', () => emitter.emit('editor:focusPrevious'))
}
