const { series } = require('gulp')
var watch = require('glob-watcher')
var fs = require('fs')
var path = require('path')

const watcher = watch(['../src/main/js/**/*.js', '../libs/**/*.js'])

function autoSync () {
  watcher.on('change', function (srcFilePath) {
    console.log(srcFilePath + ' is changed')
    var targetFileDest = path.normalize(
      './simple/js/'
      + srcFilePath.replace('../src/main/js/', 'lang/')
    )
    fs.createReadStream(srcFilePath)
    .pipe(fs.createWriteStream(targetFileDest))
  })
}

exports.autoSync = autoSync
