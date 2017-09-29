var choo = require('choo')

var app = choo()
app.use(require('choo-devtools')())
app.use(require('choo-log')())
// app.use(require('choo-reload')())

app.use(require('./state'))

app.route('/', require('./views/main'))

if (!module.parent) app.mount('#choo')
else {
  module.exports = app
}
