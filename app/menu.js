const menuConfig = [{
    title: 'menu item',
    onClick: () => {
        console.log('item');
    }
}, {
    title: 'parent',
    children: [{
        title: 'child',
        onClick: () => {
            console.log('child');
        }
    }, {
        title: 'child2',
        onClick: () => {
            console.log('child 2');
        }
    }]
}]

function displayMenu(menuElement) {
	menuConfig.forEach((menuItem) => {
        let li = document.createElement('li')
        li.classList.add('menu__item')
        li.innerHTML = menuItem.title
        if (menuItem.onClick) {
            li.addEventListener('click', menuItem.onClick)
        }
        if (menuItem.children) {
            li.innerHTML += '<i class="fa fa-angle-right" aria-hidden="true" style="float:right;"></i>'
            let ul = document.createElement('ul')
            ul.classList.add('menu__nested')
            menuItem.children.forEach((child) => {
                let liChild = document.createElement('li')
                liChild.classList.add('menu__neste-item')
                liChild.innerHTML = child.title
                if (child.onClick) {
                    liChild.addEventListener('click', child.onClick)
                }
                ul.appendChild(liChild)
            })
            li.appendChild(ul)
        }
        menuElement.appendChild(li)
    })
}

const setupMenu = (menuElement, toggleElement) => {
	displayMenu(menuElement)
	let menuVisible = false
	toggleElement.addEventListener('click', () => {
		menuVisible = !menuVisible
		menuElement.style.display = menuVisible ? 'block' : 'none'
	})
}

module.exports = setupMenu
