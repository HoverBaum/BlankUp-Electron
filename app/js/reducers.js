const reducers = {
	saveEditor: (newEditor, state) => {
		return Object.assign({}, state, {
			editors: state.editors.concat([newEditor])
		})
	},
	setEditorActive: (id, state) => {
		return Object.assign({}, state, {
			editors: state.editors.map(editor => {
				if (editor.id === id) {
					editor.active = true
				} else {
					editor.active = false
				}
				return editor
			})
		})
	},
	removeEditor: (id, state) => {
		return Object.assign({}, state, {
			editors: state.editors.filter(editor => editor.id !== id)
		})
	},
	setEditorChanged: (id, state) => {
		return Object.assign({}, state, {
			editors: state.editors.map(editor => {
				if (editor.id === id) {
					editor.changed = true
				}
				return editor
			})
		})
	},
	setEditorUnchanged: (id, state) => {
		return Object.assign({}, state, {
			editors: state.editors.map(editor => {
				if (editor.id === id) {
					editor.changed = false
				}
				return editor
			})
		})
	},
	setCurrentEditorsFilePath: (filePath, state) => {
		return Object.assign({}, state, {
			editors: state.editors.map(editor => {
				if(editor.active) {
					return Object.assign({}, editor, {
						filePath: filePath,
						name: path.parse(filePath).name
					})
				} else {
					return editor
				}
			})
		})
	}
}

module.exports = reducers
