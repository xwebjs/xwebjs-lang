var gulp = require('gulp')
var jasmineBrowser = require('gulp-jasmine-browser')
var KarmaServer = require('karma').Server
var watch = require('gulp-watch')
let _ = require('underscore')
const fse = require('fs-extra')
const eslint = require('gulp-eslint')
var path = require('path')
var pInfo = fse.readJsonSync('../package.json')
var args = require('yargs').argv

var paths = {
  target: '../target',
  targetLibs: '../target/libs',
  targetJs: '../target/js',
  nodeModulePath: '../node_modules',
  mainSource: '../src/main',
  testSource: '../src/test',
  testSourceFilesPath: [],
}

gulp.task('clean', function () {
  fse.removeSync(paths.target)
})

gulp.task('process-resources', function () {
  var dependencies = pInfo.dependencies
  _.each(dependencies, function (value, key) {
    var pJson = fse.readJsonSync(
      path.resolve(paths.nodeModulePath, key, 'package.json')
    )
    if (pJson.hasOwnProperty('main')) {
      var mainFileName = pJson.main
      var sourceFile = path.resolve(paths.nodeModulePath, key, mainFileName)
      var targetFile = path.resolve(paths.targetLibs, mainFileName)
      fse.copySync(sourceFile, targetFile)
    }
  }, this)
})
/**
 * Testing phase
 */
gulp.task('compile', ['process-resources'], function () {
  return gulp.src([paths.mainSource + '/**/*.js']).pipe(gulp.dest(paths.target))
})

gulp.task('compile_app', function () {
  console.log(args.appSrcPath)
})

gulp.task('test', ['compile', 'test-headless'])

gulp.task('test-codeCheck', function () {
  return gulp.src([paths.mainSource + '/**/*.js']).pipe(eslint()).pipe(eslint.format()).pipe(eslint.failAfterError())
})

gulp.task('test-headless', ['compile'], function () {
  return gulp.src(paths.testSourceFilesPath).pipe(jasmineBrowser.specRunner({ console: true })).pipe(jasmineBrowser.headless())
})

gulp.task('test-on-karma', ['compile'], function (done) {
  new KarmaServer({
    configFile: [
      path.resolve('../karma-shared.conf.js'),
      path.resolve('../karma-core.conf.js'),
      path.resolve('../karma-module-loader.conf.js')
    ],
    singleRun: true,
  }, done).start()
})

/**
 * Default goal settings
 */
gulp.task('default', ['compile', 'test'])

/**
 * Additional exposed command
 */
gulp.task('view-tests', ['compile'], function () {
  return gulp.src(
    paths.testSourceFilesPath).pipe(watch(paths.testSourceFilesPath)).pipe(jasmineBrowser.specRunner()).pipe(jasmineBrowser.server({ port: 8888 }))
})

gulp.task('watchSrc',
  function () {
    gulp.watch(path.resolve(paths.mainSource, './js/*.js'), ['compile'])
  }
)
