const ipc = require('electron').ipcRenderer

module.exports = function handleIPCMessages (state, emitter) {
  ipc.on('newFile', () => emitter.emit('newEditor', {}))
}
