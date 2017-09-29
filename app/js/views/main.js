const html = require('choo/html')

const mainView = (state, emit) => html`

  <div id="app" class="app">
    <main>
      <nav class="editor-nav" style=${state.editors.length === 0 ? 'display: none;' : ''}>
      <ul>
        ${state.editors.map(editor => html`
          <li
            class="editor-nav__tab ${editor.active ? 'editor-nav__tab_active' : ''} ${editor.changed ? 'editor-nav__tab_changed' : ''}"
            data-editor-id="${editor.id}"
            onclick=${(e) => {
              if (/editor-nav__tab-close-icon/g.test(e.target.className)) return
              emit('activateEditor', editor.id, () => {})
            }}>
            <i class="fa fa-circle-o editor-nav__tab-change-icon" style=${editor.changed ? '' : 'display: none;'}></i>
            ${editor.name.length <= 19 ? editor.name : editor.name.substr(0,16) + '...'}
            <i class="fa fa-close editor-nav__tab-close-icon"
              onclick=${(e)  => {
                emit('closeEditor', editor.id, () => {})
              }}>
            </i>
          </li>`)}
      </ul>
    </nav>
    ${state.editors.length === 0 ? html`<div class="no-editor-placeholder">
        <img class="no-editor-placeholder__image" src="img/BlankUpSymbolBW.png" /><br />
        <span class="no-editor-placeholder__text">${state.hints[Math.floor(Math.random()*state.hints.length)]}</span>
      </div>` : ''
    }
    </main>
  </div>

`

module.exports = mainView
