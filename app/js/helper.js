module.exports.findCurrentEditorIndex = editors => {
	let currentIndex = 0
	editors.forEach((editor, index) => {
		if(editor.active === true) {
			currentIndex = index
		}
	})
	return currentIndex
}
