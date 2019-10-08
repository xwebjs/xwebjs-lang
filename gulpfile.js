const { src, dest, parallel } = require('gulp')
const concat = require('gulp-concat')
const watcher = require('glob-watcher')
const uglify = require('uglify-js')
const through2 = require('through2')

const needsSourceMap = false

function watchFiles () {
  watcher('./src/main/js/core/*', packCore)
  watcher('./src/main/js/boot/**', packBoot)
  watcher('./libs/*', packLibs)
}

function packLibs () {
  return src('libs/*.js', { sourcemaps: needsSourceMap })
  .pipe(dest('target/js/libs', { sourcemaps: needsSourceMap }))
}

function packBoot () {
  console.log('Package boot file')
  return src('src/main/js/boot/**', { sourcemaps: needsSourceMap })
  .pipe(dest('target/js', { sourcemaps: needsSourceMap }))
}

function packCore () {
  console.log('Package core js files')
  return src('src/main/js/core/*.js', { sourcemaps: needsSourceMap })
  .pipe(through2.obj(function (file, _, cb) {
    if (file.isBuffer()) {
      const code = file.contents.toString() + ';'
      file.contents = Buffer.from(code)
    }
    cb(null, file)
  }))
  .pipe(concat('xwebjs.js'))
  .pipe(through2.obj(function (file, _, cb) {
    if (file.isBuffer()) {
      const code = uglify.minify(
        file.contents.toString()
      )
      file.contents = Buffer.from(code.code)
    }
    cb(null, file)
  }))
  .pipe(dest('target/js/libs', { sourcemaps: needsSourceMap }))
}

// The `build` function is exported so it is public and can be run with the `gulp` command.
// It can also be used within the `series()` composition.
function build (cb) {
  // body omitted
  cb()
}

exports.watch = watchFiles
exports.packLibs = packLibs
exports.packCore = packCore
exports.packBoot = packBoot

exports.package = parallel(
  packBoot, packCore, packLibs
)

exports.build = build
