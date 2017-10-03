const ipc = require('electron').ipcRenderer
const fs = require('fs')
const path = require('path')

module.exports = function handleIPCMessages (state, emitter) {
  ipc.on('newFile', () => emitter.emit('editor:new', {}))

  ipc.on('showSyntaxExample', () => emitter.emit('showSyntaxExample'))

  ipc.on('saveCurrentEditor', () => emitter.emit('editor:saveCurrent'))

  ipc.on('focusNextEditor', () => emitter.emit('editor:focusNext'))

  ipc.on('focusPreviousEditor', () => emitter.emit('editor:focusPrevious'))

  ipc.on('closeCurrentEditor', () => emitter.emit('editor:closeCurrent'))

  ipc.on('togglePreview', () => emitter.emit('editor:togglePreview'))

  ipc.on('openFiles', (e, files) => {
    files.forEach(filePath => {
      fs.readFile(filePath, 'utf8', (err, markdown) => {
        const data = {
          filePath,
          name: path.parse(filePath).name,
          markdown
        }
        emitter.emit('editor:new', data, () => {})
      })
    })
  })

  ipc.on('newFilePath', (e, filePath, id, closeEditor) => {
    // Check if the user canceled out of choosing a filepath.
    if (filePath === null) return
    emitter.emit('editor:setFilePath', {id, filePath})
    emitter.emit('editor:save', {id})
    if (closeEditor === true) {
      emitter.emit('editor:close', id)
    }
  })
}
