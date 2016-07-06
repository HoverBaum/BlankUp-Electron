const choo = require('choo')
const html = require('choo/html')
const app = choo({
	onStateChange(action, state, prev, caller, createSend) {
		console.log('newState', state, action);
	}
})

const newEditor = createNewEditor()

function createNewEditor() {
	const newEditor = {
		active: false,
		changed: false,
		filePath: null
	}
	let div = document.createElement('div')
	div.style.height = '100%'
	document.body.appendChild(div)
	newEditor.BlankUp = BlankUp(div)
	newEditor.editor = div
	document.body.removeChild(div)
	return newEditor
}

app.model({
    state: {
        editors: [newEditor]
    },
    reducers: {
        addEditor: (data, state) => {
			state.editors.concet([createNewEditor()])
			return state
		}
    }
})

const mainView = (state, prev, send) => html`
  <main>
    <div class="editors" id="editors">
		${state.editors.map(editor => html`<div class="editor">${editor.editor}</div>`)}
	</div>
  </main>
`

app.router((route) => [
    route('/', mainView)
])

const tree = app.start()
document.body.appendChild(tree)
