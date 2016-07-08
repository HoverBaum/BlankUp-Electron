const fs = require('fs')
const path = require('path')
const ipc = require('electron').ipcRenderer
const choo = require('choo')
const html = require('choo/html')
const app = choo({
    onStateChange(action, state, prev, caller, createSend) {
        console.log('newState\n', state)
    },
    onAction(action, state, name, caller, createSend) {
        console.log(`action ${name}\n`, action)
    }
})

//FIXME editors don't display all their contents initially
//FIXME Can't click below editor to get into it.

const generateId = () => {
    return (Date.now() + Math.random().toString(36).substr(2, 9)).toUpperCase()
}

/**
 *   Create a new editor. Optionally set some parameters.
 *   @param  {Object} infos - Set parameters on the new editor.
 *   @return {Obejct}       - A new editor.
 */
function createNewEditor(infos) {
    const newEditor = {
        active: infos.active || false,
        changed: false,
        filePath: infos.filePath || null,
        name: infos.name || 'untitled',
        id: generateId()
    }
    let div = document.createElement('div')
    div.style.height = '100%'
    document.body.appendChild(div)
    newEditor.BlankUp = BlankUp(div)
    newEditor.BlankUp.setMarkdown(infos.markdown || '')
    newEditor.BlankUp.on('change', (newValue) => {
        document.body.dispatchEvent(new CustomEvent('editorChanged', {
            detail: {
                id: newEditor.id,
                newValue
            }
        }))
    })
    newEditor.editor = div
    document.body.removeChild(div)
    return newEditor
}

app.model({
    state: {
        editors: []
    },
    reducers: {
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
        }
    },
	effects: {
        saveCurrentEditor: (action, state, send) => {
			const editor = state.editors.find(editor => editor.active)
			if(editor.filePath && editor.filePath !== null) {
				fs.writeFile(editor.filePath, editor.BlankUp.getMarkdown(), (err) => {
					if(err) {
						//TODO Error handling
						return
					}
					send('setEditorUnchanged', editor.id, () => {})
				})
			} else {

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
			send('saveEditor', newEditor, () => {})
			send('activateEditor', newEditor.id, () => {})
		},
		activateEditor: (id, state, send) => {
			send('setEditorActive', id, () => {})

			//Now change the displayed editor outside of Choo.
			const BlankUp = state.editors.find(editor => editor.id === id)
			const container = document.querySelector('#editorContianer')
			container.innerHTML = ''
			container.appendChild(BlankUp.editor)
			const textarea = container.querySelector('textarea')
			textarea.focus()
		},
		closeEditor: (id, state, send) => {

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
				document.querySelector('#editorContianer').innerHTML = ''
			}

			//Do this last so all prior operations can use the old indexes.
			send('removeEditor', id, () => {})
		},
		closeCurrentEditor: (data, state, send) => {
            const currentId = state.editors.find(editor => editor.active === true).id
			send('closeEditor', currentId, () => {})
        }
    },
    subscriptions: [
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
            ipc.on('saveCurrentEditor', () => {
                send('saveCurrentEditor', () => {})
            })
        },
		(send, done) => {
			ipc.on('newFile', () => {
				const editor = createNewEditor({})
				send('addEditor', editor, () => {})
			})
		}
    ]
})

const mainView = (state, prev, send) => html `
  <main>
  	<nav class="editor-nav" style=${state.editors.length === 0 ? 'display: none;' : ""}>
		<ul>
			${state.editors.map(editor => html`<li
				class="editor-nav__tab ${editor.active ? 'editor-nav__tab_active' : ''} ${editor.changed ? 'editor-nav__tab_changed' : ''}"
				data-editor-id="${editor.id}"
				onclick=${(e) => {
						if(/editor-nav__tab-close-icon/g.test(e.target.className)) return
						send('activateEditor', editor.id, () => {})
					}}>
					<i class="fa fa-circle-o editor-nav__tab-change-icon"></i>
					${editor.name.length <= 19 ? editor.name : editor.name.substr(0,16) + '...'}
					<i class="fa fa-close editor-nav__tab-close-icon"
						onclick=${(e) => {
							send('closeEditor', editor.id, () => {})
						}}>
					</i>
				</li>`)}
		</ul>
	</nav>
	${state.editors.length === 0 ? html`<div class="no-editor-placeholder">
			<img class="no-editor-placeholder__image" src="img/BlankUpSymbolBW.png" /><br />
			<span class="no-editor-placeholder__text">Drag + Drop a Markdown file here to start.</span>
		</div>` : ''
	}
  </main>
`

app.router((route) => [
    route('/', mainView)
])

const tree = app.start()
document.getElementById('app').appendChild(tree)
