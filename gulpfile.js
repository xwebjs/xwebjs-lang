const { series } = require('gulp')
var watch = require('glob-watcher')

var watcher = watch(['./src/*.js', './libs/*.js'])

// Listen for the 'change' event to get `path`/`stat`
// No async completion available because this is the raw chokidar instance
watcher.on('change', function (path) {
  console.log(path + ' is changed')
})

// Listen for other events
// No async completion available because this is the raw chokidar instance
watcher.on('add', function (path) {
  console.log(path + ' is added')
})

function prepareResources (cb) {
  cb()
}

// The `clean` function is not exported so it can be considered a private task.
// It can still be used within the `series()` composition.
function clean (cb) {
  // body omitted
  cb()
}

// The `build` function is exported so it is public and can be run with the `gulp` command.
// It can also be used within the `series()` composition.
function build (cb) {
  // body omitted
  cb()
}

exports.build = build
exports.default = series(
  prepareResources, clean, build
)
