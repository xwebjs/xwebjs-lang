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
          projectFiles.corePath.testSource + '/spec/core/*_spec.js'
        ]
      ),
    proxies: {
      '/system/': '/base/' + projectFiles.corePath.targetJs,
    }
  })
}
