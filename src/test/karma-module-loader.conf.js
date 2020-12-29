var _ = require('underscore')
var projectFiles = require('./projectFiles')
var sharedConfig = require('./karma-shared.conf')

module.exports = function (config) {
  sharedConfig(config)
  config.set({
    singleRun: false,
    concurrency: 1,
    files:
      _.union(
        projectFiles.files.libFiles,
        projectFiles.files.coreSourceFiles,
        projectFiles.files.testSourceBaseFilesPath,
        [
          projectFiles.corePath.testSource + '/spec/module_loader/**/*_spec.js',
          {
            pattern: projectFiles.corePath.testSource + '/spec/module_loader/**/*.js',
            included: false,
            nocache: true
          },
          {
            pattern: projectFiles.corePath.testSource + '/spec/module_loader/**/*.xlib',
            included: false,
            nocache: true
          },
          {
            pattern: projectFiles.corePath.testSource + '/spec/module_loader/**/*.xmeta',
            included: false,
            nocache: true
          },
          {
            pattern: projectFiles.corePath.targetJs + 'boot/**.js',
            included: false,
            nocache: true
          }
        ]
      ),
    proxies: {
      '/': '/base/src/main/js/boot/',
      '/config/': '/base/' + projectFiles.corePath.testSource + '/spec/module_loader/config/',
      '/libs/': '/base/src/main/js/core/',
      '/libs/q.js': '/base/libs/q.js',
      '/libs/dexie.js': '/base/libs/dexie.js',
      '/test1/program/': '/base/' + projectFiles.corePath.testSource + '/spec/module_loader/test_1/program/',
      '/test2/program/': '/base/' + projectFiles.corePath.testSource + '/spec/module_loader/test_2/program/',
      '/test3/program/': '/base/' + projectFiles.corePath.testSource + '/spec/module_loader/test_3/program/',
      '/test2/vm/': '/base/' + projectFiles.corePath.testSource + '/spec/module_loader/test_2/vm/',
      '/test3/vm/': '/base/' + projectFiles.corePath.testSource + '/spec/module_loader/test_3/vm/'
    }
  })
}
