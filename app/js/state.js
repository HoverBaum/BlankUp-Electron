const ipc = require('electron').ipcRenderer
const path = require('path')
const fs = require('fs')

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
        emitter.emit('editor:activate', id)
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
    emitter.emit('editor:activate', newEditor.id)
  })

  emitter.on('editor:activate', id => {
    state.editors = state.editors.map(editor => {
      if (editor.id === id) {
        editor.active = true
      } else {
        editor.active = false
      }
      return editor
    })

    // Put the active editor into the container.
    // A seperate container is easier because otherwise rendering
    // will render the editor as well meaning we have to handle focus on it.
    const editorContainer = document.querySelector('#editorContainer')
    editorContainer.innerHTML = ''
    editorContainer.appendChild(state.editors.find(editor => editor.id === id).editor)

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
        emitter.emit('editor:activate', state.editors[index].id)
      } else {
        // If this is the last editor make sure to clear the editorContainer.
        document.querySelector('#editorContainer').innerHTML = ''
      }

      // Do this last so all prior operations can use the old indexes.
      state.editors = state.editors.filter(editor => editor.id !== id)
      emitter.emit('render')
    }
  })

  emitter.on('editor:changed', id => {
    state.editors = state.editors.map(editor => {
      if (editor.id === id) editor.changed = true
      return editor
    })
    emitter.emit('render')
  })

  emitter.on('editor:focusNext', () => {
    if (!state.editors || state.editors.length === 0) return
    const activeIndex = state.editors.findIndex(editor => editor.active)
    let nextIndex = activeIndex + 1
    if (nextIndex === state.editors.length) nextIndex = 0
    const id = state.editors[nextIndex].id
    emitter.emit('editor:activate', id)
  })

  emitter.on('editor:focusPrevious', () => {
    if (!state.editors || state.editors.length === 0) return
    const activeIndex = state.editors.findIndex(editor => editor.active)
    const nextIndex = activeIndex === 0 ? state.editors.length - 1 : activeIndex - 1
    const id = state.editors[nextIndex].id
    emitter.emit('editor:activate', id)
  })

  emitter.on('editor:save', data => {
    const id = data.id
    const editor = state.editors.find(editor => editor.id === id)
    if (editor.filePath && editor.filePath !== null) {
      fs.writeFile(editor.filePath, editor.BlankUp.getMarkdown(), (err) => {
        if (err) {
          ipc.send('errorDialog', 'An error occured while saving the file.\n\nPlease try again.')
          return
        }
        emitter.emit('setEditorUnchanged', editor.id, () => {})
        if (data.closeEditor) {
          emitter.emit('closeEditor', id, () => {})
        }
      })
    } else {

      // Tell main process that we need a new filePath.
      ipc.send('saveDialog', id, data.closeEditor)
    }
  })

  emitter.on('editor:saveCurrent', () => {
    const id = state.editors.find(editor => editor.active).id
    emitter.emit('editor:save', {id})
  })

  emitter.on('showSyntaxExample', () => {
    const markdownPath = path.join(__dirname, '..', 'assets', 'syntax.md')
    const markdown = fs.readFileSync(markdownPath).toString()
    emitter.emit('newEditor', {name: 'Syntax example', markdown}, () => {})
  })
}
