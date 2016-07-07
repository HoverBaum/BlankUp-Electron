const fs = require('fs')
const path = require('path')
const ipc = require('electron').ipcRenderer
const choo = require('choo')
const html = require('choo/html')
const app = choo({
	onStateChange(action, state, prev, caller, createSend) {
		console.log('newState\n', state);
	},
	onAction(action, state, name, caller, createSend) {
		console.log(`action ${name}\n`, action);
	}
})

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
	newEditor.editor = div
	document.body.removeChild(div)
	return newEditor
}

app.model({
    state: {
        editors: []
    },
    reducers: {
        addEditor: (data, state) => {
			return Object.assign({}, state, {
				editors: state.editors.map(editor => {
					editor.active = false
					return editor
				})
				.concat([createNewEditor({
					name: data.name,
					filePath: data.filePath,
					markdown: data.markdown,
					active: true
				})])
			})
		},
		setEditorActive: (id, state) => {
			return Object.assign({}, state, {
				editors: state.editors.map(editor => {
					if(editor.id === id) {
						editor.active = true
					} else {
						editor.active = false
					}
					return editor
				})
			})
		},
		closeCurrentEditor: (data, state) => {
			const newState = Object.assign({}, state, {
				editors: state.editors.filter(editor => editor.active === false)
			})
			if(newState.editors.length >= 1) {
				newState.editors[0].active = true
			}
			return newState
		},
		closeEditor: (id, state) => {
			console.log(state.editors.map(e => e));
			const newState = Object.assign({}, state, {
				editors: state.editors.filter(editor => editor.id !== id)
			})
				console.log(newState.editors.map(e => e));
			console.log(newState.editors.length >= 1 && newState.editors.every(editor => !editor.active));
			if(newState.editors.length >= 1 && newState.editors.every(editor => !editor.active)) {
				newState.editors[0].active = true
			}
			return newState
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
						if(!/.md$/.test(name)) {
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
		}
	]
})

const mainView = (state, prev, send) => html`
  <main>
  	<nav class="editor-nav" style=${state.editors.length === 0 ? 'display: none;' : ""}>
		<ul>
			${state.editors.map(editor => html`<li
				class="editor-nav__tab ${editor.active ? 'editor-nav__tab_active' : ''}"
				data-editor-id="${editor.id}"
				onclick=${(e) => {
						if(/editor-nav__tab-close-icon/g.test(e.target.className)) return
						send('setEditorActive', editor.id, () => {})
					}}>
					${editor.name.length <= 20 ? editor.name : editor.name.substr(0,16) + '...'}
					<i class="fa fa-close editor-nav__tab-close-icon"
						onclick=${(e) => {
							send('closeEditor', editor.id, () => {})
						}}>
					</i>
				</li>`)}
		</ul>
	</nav>
    <div class="editors" id="editors">
		${state.editors.map(editor => editor.active ? html`<div class="editor" id="editor${editor.id}">${editor.editor}</div>` : '')}
		${state.editors.length === 0 ? html`<div class="no-editor-placeholder">
				<img class="no-editor-placeholder__image" src="img/BlankUpSymbolBW.png" /><br />
				<span class="no-editor-placeholder__text">Drag + Drop a Markdown file here to start.</span>
			</div>` : ''}
	</div>
  </main>
`

app.router((route) => [
    route('/', mainView)
])

const tree = app.start()
document.body.appendChild(tree)
