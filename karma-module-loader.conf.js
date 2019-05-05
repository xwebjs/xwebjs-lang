var _ = require('underscore')
var projectFiles = require('./projectFiles')
var sharedConfig = require('./karma-shared.conf')

module.exports = function (config) {
  sharedConfig(config)
  config.set({
    files:
      _.union(
        projectFiles.files.libFiles,
        projectFiles.files.coreSourceFiles,
        projectFiles.files.testSourceBaseFilesPath,
        [
          projectFiles.corePath.testSource + '/spec/module_loader_test/*_spec.js',
          {
            pattern: projectFiles.corePath.testSource
              + '/spec/module_loader_test/src/root/**/*.js',
            included: false,
            nocache: true
          }
        ]
      ),
    proxies: {
      '/app/': '/base/' + projectFiles.corePath.testSource + '/spec/module_loader_test/src/root/',
      '/system/': '/base/' + projectFiles.corePath.targetJs + '/'
    }
  })
}
