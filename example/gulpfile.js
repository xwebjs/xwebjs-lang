const { gulp, src, dest, parallel, series } = require('gulp')
const watch = require('glob-watcher')
const fs = require('fs')
const examples = ['simple', 'app_with_modules']

function syncLibs () {
  console.log('Sync libs file for example')
  let pipeLine = src('../target/js/libs/*')
  const root = pipeLine
  for (const example of examples) {
    pipeLine = pipeLine.pipe(
      dest('./' + example + '/libs')
    )
  }
  return root
}

function syncBoot () {
  console.log('Sync target boot files')
  let pipeLine = src(
    ['../target/js/boot.js', '../target/js/CacheSupport.js'],
    {
      base: '../target/js/'
    }
  )
  let root = pipeLine
  for (const example of examples) {
    pipeLine = pipeLine.pipe(
      dest('./' + example + '')
    )
  }
  return root
}

function watchFiles () {
  console.log('Watching the file change:' + examples.toString())
  watch(['../target/js/boot.js', '../target/js/CacheSupport.js'], syncBoot)
  watch('../target/js/libs/*', syncLibs)
}

exports.sync = parallel(syncBoot, syncLibs)
exports.watch = watchFiles
