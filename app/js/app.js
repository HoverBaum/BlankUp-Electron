const fs = require('fs')
const choo = require('choo')
const html = require('choo/html')
const app = choo({
	onStateChange(action, state, prev, caller, createSend) {
		console.log('newState\n', state, action);
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
				editors: state.editors.concat([createNewEditor({
					name: data.name,
					filePath: data.filePath,
					markdown: data.markdown,
					active: state.editors.length === 0 ? true : false
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
		}
	]
})

const mainView = (state, prev, send) => html`
  <main>
  	<nav class="editor-nav">
		<ul>
			${state.editors.map(editor => html`<li
				class="editor-nav__tab ${editor.active ? 'editor-nav__tab_active' : ''}"
				data-editor-id="${editor.id}"
				onclick=${() => {send('setEditorActive', editor.id, () => {})}}>${editor.name.length <= 20 ? editor.name : editor.name.substr(0,16) + '...'}</li>`)}
		</ul>
	</nav>
    <div class="editors" id="editors">
		${state.editors.map(editor => editor.active ? html`<div class="editor" id="editor${editor.id}">${editor.editor}</div>` : '')}
	</div>
  </main>
`

app.router((route) => [
    route('/', mainView)
])

const tree = app.start()
document.body.appendChild(tree)
