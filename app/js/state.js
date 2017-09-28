const ipc = require('electron').ipcRenderer

const handleIPCMessages = require('./handleIPCMessages')

const createNewEditor = require('./createEditor')

module.exports = function stateInitializer (state, emitter) {
  state.hints = [
    'Drag + Drop a Markdown file here to start',
    'Press Ctrl+M to toggle the preview',
    'Get to the next open file using Ctrl+Tab'
  ]
  state.editors = []

  handleIPCMessages(state, emitter)

  emitter.on('newEditor', data => {
    // Only open each file once.
    if (data.filePath) {
      if (state.editors.some(editor => editor.filePath === data.filePath)) {
        // Set the editor containing the file active.
        const id = state.editors.find(editor => editor.filePath === data.filePath)
        emitter.emit('activateEditor', id)
        return
      }
    }

    // Create a new editor and focus it.
    const newEditor = createNewEditor({
      name: data.name,
      filePath: data.filePath,
      markdown: data.markdown
    }, emitter)
    state.editors = state.editors.concat([newEditor])
    emitter.emit('activateEditor', newEditor.id)
  })

  emitter.on('activateEditor', id => {
    state.editors = state.editors.map(editor => {
      if (editor.id === id) {
        editor.active = true
      } else {
        editor.active = false
      }
      return editor
    })
    emitter.emit('render')
  })

  emitter.on('closeEditor', id => {
    // First make sure this editor does not contain unsaved changes.
    const editor = state.editors.find(editor => editor.id === id)
    if (editor.changed) {
      ipc.send('reallyCloseDialog', id)
    } else {
      // Really close the editor.
      if (state.editors.length > 1) {
        // Set the one before the current one active if there are more.
        let editorIndex = 0
        state.editors.forEach((editor, index) => {
          if (editor.id === id) {
            editorIndex = index
          }
        })
        const index = editorIndex === 0 ? 1 : editorIndex - 1
        emitter.emit('activateEditor', state.editors[index].id)
      } else {
        // If this is the last editor make sure to clear the editorContainer.
        document.querySelector('#editorContainer').innerHTML = ''
      }

      // Do this last so all prior operations can use the old indexes.
      state.editors = state.editors.filter(editor => editor.id !== id)
      emitter.emit('render')
    }
  })

  emitter.on('editorChanged', id => {
    state.editors = state.editors.map(editor => {
      if (editor.id === id) editor.changed = true
      return editor
    })
    emitter.emit('render')
  })
}
