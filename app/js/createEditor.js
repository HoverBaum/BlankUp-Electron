require('BlankUp')

/**
 *   Create a new editor. Optionally set some parameters.
 *   @param  {Object} infos - Set parameters on the new editor.
 *   @return {Obejct}       - A new editor.
 */
module.exports = function createNewEditor (infos, emitter) {
  const newEditor = {
    active: infos.active || false,
    changed: false,
    filePath: infos.filePath || null,
    name: infos.name || 'untitled',
    id: generateId(),
    preview: infos.preview || false
  }
  let div = document.createElement('div')
  div.style.height = '100%'
  document.body.appendChild(div)
  newEditor.BlankUp = BlankUp(div)
  newEditor.BlankUp.setMarkdown(infos.markdown || '# Untitled')
  newEditor.BlankUp.on('change', (event) => {
    // Fire a change event only if editor was not changed before.
    if (newEditor.changed) return
    emitter.emit('editorChanged', newEditor.id)
  })
  newEditor.editor = div
  document.body.removeChild(div)
  return newEditor
}

const generateId = () => {
  return (Date.now() + Math.random().toString(36).substr(2, 9)).toUpperCase()
}
