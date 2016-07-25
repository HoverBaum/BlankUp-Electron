const ipc = require('electron').ipcRenderer
const findCurrentEditorIndex = require('./helper').findCurrentEditorIndex

const effects = {
	saveCurrentEditor: (action, state, send) => {
		const editorId = state.editors.find(editor => editor.active).id
		send('saveEditor', {id: editorId}, () => {})
	},
	saveEditor: (data, state, send, done) => {
		const id = data.id
		const editor = state.editors.find(editor => editor.id === id)
		if(editor.filePath && editor.filePath !== null) {
			fs.writeFile(editor.filePath, editor.BlankUp.getMarkdown(), (err) => {
				if(err) {
					ipc.send('errorDialog', 'An error occured while saving the file.\n\nPlease try again.')
					return
				}
				send('setEditorUnchanged', editor.id, () => {})
				done()
				if(data.closeEditor) {
					send('closeEditor', id, () => {})
				}
			})
		} else {

			//Tell main process that we need a new filePath.
			ipc.send('saveDialog', id, data.closeEditor)
		}
	},
	addEditor: (data, state, send) => {

		//Only open each file once.
		if(data.filePath) {
			if(state.editors.some(editor => editor.filePath === data.filePath)) {

				//Set the editor containing the file active.
				const id = state.editors.find(editor => editor.filePath === data.filePath)
				send('activateEditor', id, () => {})
				return
			}
		}

		//Create a new editor and focus it.
		const newEditor = createNewEditor({
			name: data.name,
			filePath: data.filePath,
			markdown: data.markdown
		})
		send('addEditorToStore', newEditor, () => {})
		send('activateEditor', newEditor.id, () => {})
	},
	activateEditor: (id, state, send) => {
		send('setEditorActive', id, () => {})

		//Now change the displayed editor outside of Choo.
		const BlankUp = state.editors.find(editor => editor.id === id)
		const container = document.querySelector('#editorContainer')
		container.innerHTML = ''
		container.appendChild(BlankUp.editor)
		send('focusEditor', id, () => {})
	},
	focusEditor: (id, state, send) => {
		const BlankUp = state.editors.find(editor => editor.id === id)
		BlankUp.BlankUp.editor.focus() //FIXME  wait for BlankUp to implement focus() and use that
	},
	focusCurrentEditor: (action, state, send) => {
		const id = state.editors.find(editor => editor.active === true).id
		send('focusEditor', id, () => {})
	},
	focusNextEditor: (action, state, send) => {
		let currentIndex = findCurrentEditorIndex(state.editors)
		let nextIndex = currentIndex += 1
		if(nextIndex >= state.editors.length) {
			nextIndex = 0
		}
		send('activateEditor', state.editors[nextIndex].id, () => {})
	},
	focusPreviousEditor: (action, state, send) => {
		let currentIndex = findCurrentEditorIndex(state.editors)
		let previousIndex = currentIndex -= 1
		if(previousIndex < 0) {
			previousIndex = state.editors.length - 1
		}
		send('activateEditor', state.editors[previousIndex].id, () => {})
	},
	closeEditor: (id, state, send) => {

		//First make sure this editor does not contain unsaved changes.
		const editor = state.editors.find(editor => editor.id === id)
		if(editor.changed) {
			ipc.send('reallyCloseDialog', id)
		} else {
			send('reallyCloseEditor', id, () => {})
		}
	},
	reallyCloseEditor: (id, state, send) => {

		//Check if there are more editors.
		if(state.editors.length > 1) {

			//Set the one before the current one active if there are more.
			let editorIndex = 0
			state.editors.forEach((editor, index) => {
				if(editor.id === id) {
					editorIndex = index
				}
			})
			const index = editorIndex === 0 ? 1 : editorIndex - 1
			send('activateEditor', state.editors[index].id, () => {})
		} else {

			//If this is the last editor make sure to clear the editorContainer.
			document.querySelector('#editorContainer').innerHTML = ''
		}

		//Do this last so all prior operations can use the old indexes.
		send('removeEditor', id, () => {})
	},
	closeCurrentEditor: (data, state, send) => {
		const currentId = state.editors.find(editor => editor.active === true).id
		send('closeEditor', currentId, () => {})
	},
	toggleCurrentPreview: (data, state, send) => {
		const currentEditor = state.editors.find(editor => editor.active)
		currentEditor.BlankUp.previewVisible(!currentEditor.preview)
		const id = currentEditor.id
		send('togglePreview', id, () => {})
	}
}

module.exports = effects
