const subscriptions = [
	(send, done) => {
		window.ondrop = (ev) => {
			ev.preventDefault()
			for (var key in ev.dataTransfer.files) {
				if (ev.dataTransfer.files.hasOwnProperty(key)) {
					const file = ev.dataTransfer.files[key]
					let name = file.name

					//Made sure it is a markdwon file.
					if (!/.md$/.test(name)) {
						return
					}
					name = name.replace(/.md$/, '')
					const filePath = file.path
					fs.readFile(filePath, 'utf8', (err, data) => {
						send('addEditor', {
							markdown: data,
							name,
							filePath
						}, () => {})
					})
				}
			}
		}
	},
	(send, done) => {
		ipc.on('closeCurrentEditor', () => {
			send('closeCurrentEditor', () => {})
		})
	},
	(send, done) => {
		ipc.on('openFiles', (e, files) => {
			files.forEach(filePath => {
				fs.readFile(filePath, 'utf8', (err, markdown) => {
					const data = {
						filePath,
						name: path.parse(filePath).name,
						markdown
					}
					send('addEditor', data, () => {})
				})
			})
		})
	},
	(send, done) => {
		document.body.addEventListener('editorChanged', (infos) => {
			send('setEditorChanged', infos.detail.id, () => {})
		})
	},
	(send, done) => {
		document.body.addEventListener('focusCurrentEditor', (infos) => {
			send('focusCurrentEditor', infos.detail, () => {})
		})
	},
	(send, done) => {
		ipc.on('saveCurrentEditor', () => {
			send('saveCurrentEditor', () => {})
		})
	},
	(send, done) => {
		ipc.on('newFile', () => {
			const editor = createNewEditor({})
			send('addEditor', editor, () => {})
		})
	},
	(send, done) => {
		ipc.on('focusNextEditor', () => {
			send('focusNextEditor', () => {})
		})
	},
	(send, done) => {
		ipc.on('focusPreviousEditor', () => {
			send('focusPreviousEditor', () => {})
		})
	},
	(send, done) => {
		ipc.on('newFilePath', (e, filePath, id, closeEditor) => {

			//Check if the user canceled out of choosing a filepath.
			if(filePath === null) return
			send('setEditorFilePath', {id, filePath}, () => {})
			send('saveEditor', {id, closeEditor}, () => {})
		})
	},
	(send, done) => {

		//save cahnges, dont save changes, cancel
		ipc.on('reallyCloseDialogAnswer', (e, index, id) => {
			if(index === 0) {

				//Save changes and then close.
				send('saveEditor', {id, closeEditor: true}, () => {
					send('reallyCloseEditor', id, () => {})
				})
			} else if(index === 1) {

				//Just close.
				send('reallyCloseEditor', id, () => {})
			} else {

				//Do nothing.
			}
		})
	},
	(send, done) => {
		ipc.on('togglePreview', () => {
			send('toggleCurrentPreview', () => {})
		})
	}
]

module.exports = subscriptions
