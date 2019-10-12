var basePath = ''

var corePath = {
  target: basePath + '',
  targetLibs: basePath + 'libs',
  targetJs: basePath + 'src/main/js/',
  nodeModulePath: basePath + 'node_modules',
  mainSource: basePath + 'src/main',
  testSource: basePath + 'src/test'
}

var projectFiles = {
  libFiles: [
    corePath.targetLibs + '/q.js',
    corePath.targetLibs + '/axios.js',
    corePath.targetLibs + '/lodash.js',
    corePath.targetLibs + '/dexie.js'
  ],
  coreSourceFiles: [
    corePath.targetJs + '/core/core.js',
    corePath.targetJs + '/core/vm.js'
  ],
  testSourceBaseFilesPath: [
    corePath.testSource + '/spec/common_helper.js'
  ]
}

if (exports) {
  exports.files = projectFiles
  exports.corePath = corePath
}
