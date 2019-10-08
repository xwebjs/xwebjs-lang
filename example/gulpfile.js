const { gulp, src, dest, parallel, series } = require('gulp')
const watch = require('glob-watcher')
const fs = require('fs')

var examples = ['simple']

function syncLibs () {

  console.log('Sync libs file for example')
  let pipeLine = src('../target/js/libs/*')

  for (const example of examples) {
    pipeLine.pipe(
      dest('./' + example + '/libs')
    )
  }

  return pipeLine
}

function syncBoot () {

  let pipeLine = src(
    ['../target/js/boot.js', '../target/js/cache/**'],
    {
      base: '../target/js/'
    }
  )

  for (const example of examples) {
    pipeLine.pipe(
      dest('./' + example + '')
    )
  }

  return pipeLine
}

function watchFiles () {
  console.log('Watching the file change:' + examples.toString())
  watch(['../target/js/boot.js', '../target/js/cache/**'], syncBoot)
  watch('../target/js/libs/*', syncLibs)
}

exports.sync = parallel(syncBoot, syncLibs)
exports.watch = watchFiles
