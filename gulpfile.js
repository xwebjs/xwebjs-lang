const { src, dest, parallel, series } = require('gulp')
const concat = require('gulp-concat')
const watcher = require('glob-watcher')
const uglify = require('gulp-uglify')
const del = require('del')
const through2 = require('through2')

const needsSourceMap = false

function addSeparator (file, _, cb) {
  if (file.isBuffer()) {
    let fileContent = file.contents.toString()
    fileContent = fileContent + ';'
    file.contents = Buffer.from(fileContent)
  }
  cb(null, file)
}

function watchFiles () {
  watcher(['src/main/js/core/*.js', 'libs/*.js'], pack)
  watcher('src/main/js/boot/**', packBoot)
}

function packBoot () {
  console.log('Package boot file')
  return src('src/main/js/boot/**', { sourcemaps: needsSourceMap })
  .pipe(uglify())
  .pipe(dest('target/js', { sourcemaps: needsSourceMap }))
}

function copySharedLibs () {
  console.log('Copy shared libs files')
  return src(
    ['libs/q.js', 'libs/dexie.js'],
    { sourcemaps: needsSourceMap }
  ).pipe(uglify())
  .pipe(dest('target/js/libs', { sourcemaps: needsSourceMap }))
}

function pack () {
  console.log('Package core js files')
  return src(
    ['libs/*.js', '!libs/q.js', 'src/main/js/core/*.js',],
    { sourcemaps: needsSourceMap }
  )
  .pipe(through2.obj(addSeparator))
  .pipe(concat('xwebjs.js'))
  .pipe(uglify())
  .pipe(dest('target/js/libs', { sourcemaps: needsSourceMap }))
}

function clean () {
  return del(['./target/'])
}

exports.watch = watchFiles
exports.package = series(clean, parallel(pack, packBoot, copySharedLibs))
