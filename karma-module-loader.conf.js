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
          projectFiles.corePath.testSource + '/spec/module_loader_test/**/*_spec.js',
          {
            pattern: projectFiles.corePath.testSource
              + '/spec/module_loader_test/**/*.js',
            included: false,
            nocache: true
          }
        ]
      ),
    proxies: {
      '/test1/app/': '/base/' + projectFiles.corePath.testSource + '/spec/module_loader_test/test_1/app/',
      '/test2/app/': '/base/' + projectFiles.corePath.testSource + '/spec/module_loader_test/test_2/app/',
      '/test2/system/': '/base/' + projectFiles.corePath.testSource + '/spec/module_loader_test/test_2/system/',
    }
  })
}
