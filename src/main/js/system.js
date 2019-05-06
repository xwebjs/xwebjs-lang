/* eslint-disable no-unused-vars,spaced-comment */
(function () {
    var root = _x
    var XModule, XPackage, XModuleContext, XApp, XSystem
    var xSystem
    var systemCtx
    var systemDefaultApp
    var WebResourceUtil
    var logger

    var dependencies = {
      'core': {
        checkFn: function () {
          return _x && _x.isLangCore
        }
      }
    }

    var moduleParsedModules = {}

    function prepareCommon () {
      logger = {
        debug: function (content) {
          console.debug(content)
        },
        info: function (content) {
          console.info(content)
        },
        warn: function (error) {
          console.warn(error)
        },
        error: function (error) {
          console.error(error)
        }
      }
      WebResourceUtil = (function () {
        function storeResource (packagePath, modulName, codes) {

        }

        return _x.createCls(
          {
            staticMethods: {
              loadTextResource: function (url, onSuccess, onFail, onProgress) {
                logger.info('Load text resource from url:' + url)
                axios.get(
                  url,
                  {
                    onDownloadProgress: function (progressEvent) {
                      onProgress(progressEvent)
                    },
                    validateStatus: function (status) {
                      return status >= 200 && status < 300
                    }
                  }
                ).then(
                  function (response) {
                    onSuccess(response.data)
                  },
                  function (errors) {
                    onFail(errors)
                  }
                )
              }
            }
          })
      })()
    }

    /**
     * @class XModule
     */
    function enableModule () {
      var metaExtraction = {
        content: function (srcInfo) {
          var errors = []
          if (
            (!_x.isCustomIf(srcInfo.content) &&
              !_x.isCustomClass(srcInfo.content))
          ) {
            errors.push('Module content must be custom class or interface type')
          }
          return {
            result: srcInfo.content,
            errors: errors
          }
        },
        imports: function (srcInfo) {
          var resultDependencies = []
          var errors = []
          var importsInfo = srcInfo.imports || []
          if (_.isArray(importsInfo)) {
            resultDependencies = importsInfo
          } else {
            errors.push('Imports must be array of string')
          }
          return {
            result: resultDependencies,
            errors: errors
          }
        }
      }
      var metaExtractFunction = function (info, content) {
        var metaInfo = {}
        var errors = []
        if (!_.isObject(info)) {
          errors.push('XModule meta info must be object type:' + info)
        }
        info.content = content
        _.each(metaExtraction, function (metaExtractor, key, obj) {
          var extractionResult = metaExtractor(info)
          if (extractionResult.errors.length === 0) {
            metaInfo[key] = extractionResult.result
          } else {
            errors.push(extractionResult.errors.join('\n'))
          }
        }, this)
        return {
          metaInfo: metaInfo,
          errors: errors
        }
      }

      XModule = _x.createCls(
        {
          props: {
            content: {
              __xConfig: true,
              type: 'any'
            },
            moduleContextPath: null,
            dependencies: null
          },
          construct: [
            function (content, dependencies) {
              this.content = content
              this.dependencies = dependencies
            }
          ],
          staticMethods: {
            /**
             * @summary
             *
             * @memberOf XModule#
             * @public
             * @static
             * @method
             * @param info
             * @param fn
             */
            defineModule: [
              function (metaInfo, content) {
                var result = metaExtractFunction(metaInfo, content)
                var dependencies = result.metaInfo.imports
                var returnedModule = XModule.newInstance(
                  result.metaInfo.content,
                  dependencies
                )
                if (result.errors.length > 0) {
                  throw Error(result.errors.join('\n'))
                }
                return returnedModule
              },
              function (content) {
                return XModule.defineModule({}, content)
              }
            ],
            exportModule: function (requestId, metaInfo, factoryFn) {
              moduleParsedModules[requestId] = {
                metaInfo: metaInfo,
                factoryFn: factoryFn
              }
            }
          },
          methods: {
            setModuleContextPath: function (path) {
              this.moduleContextPath = path
            },
            getModuleContextPath: function () {
              return this.moduleContextPath
            },
            getContent: function () {
              return this.content
            },
            getClass: function () {
              var content = this.getContent()
              if (this.content.isCustomClass) {
                return this.content
              } else {
                throw Error('XModule content is not class')
              }
            },
            getInterface: function () {
              var content = this.getContent()
              if (this.content.isCustomIf) {
                return this.content
              } else {
                throw Error('XModule content is not interface')
              }
            },
            isClass: function () {
              return this.content.isCustomClass
            },
            isInterface: function () {
              return this.content.isCustomIf
            }
          }
        }
      )

      // mount API
      root.defineModule = XModule.defineModule
    }

    /**
     * @class XPackage
     */
    function enablePackage () {
      XPackage = _x.createCls(
        {
          props: {
            modules: {},
            packages: {}
          },
          construct: function () {
          },
          methods: {
            hasModule: function (moduleName) {
              return _.has(this.modules, moduleName)
            },
            getModule: function (moduleName) {
              if (this.hasModule(moduleName)) {
                return this.modules[moduleName]
              }
            },
            removeModule: function (moduleName) {
              if (this.hasModule(moduleName)) {
                this.modules[moduleName].setModuleContextPath(null)
                delete this.modules[moduleName]
              }
            },
            addModule: function (moduleName, moduleContent) {
              if (this.hasModule(moduleName)) {
                throw new Error('XModule "' + moduleName + '" has existed')
              }
              this.modules[moduleName] = moduleContent
            },
            hasPackage: function (packageName) {
              return _.has(this.packages, packageName)
            },
            getRootPackage: function (packageName) {
              if (this.hasPackage(packageName)) {
                return this.packages[packageName]
              }
            },
            addPackage: function (packageName) {
              if (!this.hasPackage(packageName)) {
                this.packages[packageName] = XPackage.newInstance()
                return this.packages[packageName]
              } else {
                throw new Error('XPackage "' + packageName + '" has existed')
              }
            }
          }
        }
      )
    }

    /**
     * @class XModuleContext
     */
    function enableModuleContext () {
      /**
       * @summary
       * Manage the loading chain and
       * generate the promise for each module based on module path
       *
       * @memberOf XModuleContext
       * @private
       * @instance
       * @method
       *
       * @param moduePath
       */
      function generateLoadingModulePromise (moduePath) {
        var me = this
        var deferred = Q.defer()
        var loadingModuleInfo = {
          status: 0,
          rawContent: null,
          modulePath: moduePath,
          promise: deferred.promise
        }
        me.loadingModules[moduePath] = loadingModuleInfo
        loadFile.call(me, loadingModuleInfo).then(
          function (loadingModuleInfo) {
            return parseModuleContent.call(me, loadingModuleInfo)
          }
        ).then(
          function (moduleContent) {
            deferred.resolve(moduleContent)
          }
        ).catch(
          function (error) {
            deferred.reject(error)
            logger.error(
              'Failed to generate loading module promise because: ' + error)
          }
        )

        return deferred.promise
      }

      function loadFile (loadingModuleInfo) {
        var me = this
        var moduleFilePaths = []
        moduleFilePaths.push(
          {
            filePath: generateRemoteModuleFilePath.call(me,
              loadingModuleInfo.modulePath),
            fullPath: loadingModuleInfo.modulePath
          }
        )
        loadingModuleInfo.status = 1
        return loadModuleFiles.call(me, moduleFilePaths).then(
          function (modulesContent) {
            var loadedModuleRawConent = modulesContent[0]
            if (!loadedModuleRawConent.isSuccess) {
              loadingModuleInfo.status = 5
              throw Error(
                'Failed to load module:' + loadedModuleRawConent.modulePath)
            }
            loadingModuleInfo.status = 2
            loadingModuleInfo.rawContent = loadedModuleRawConent.content
            return loadingModuleInfo
          }
        )
      }

      function parseModuleContent (loadingModuleInfo) {
        var me = this
        return prepareModule.call(me, loadingModuleInfo.rawContent).then(
          function (preparedModuleContent) {
            var prepardModule = XModule.defineModule(
              {
                imports: loadingModuleInfo.rawContent.metaInfo.imports
              },
              preparedModuleContent
            )
            me.register(
              loadingModuleInfo.modulePath,
              prepardModule
            )
            loadingModuleInfo.status = 3
            delete me.loadingModules[loadingModuleInfo.modulePath]
            return prepardModule
          }
        ).catch(
          function (error) {
            loadingModuleInfo.status = 4
            logger.error(
              'Failed to prepare the module [' +
              loadingModuleInfo.modulePath +
              '] because ' + error)
            throw new Error(
              'Fail to load the dependent module [' +
              loadingModuleInfo.modulePath +
              '] ')
          }
        )
      }

      /**
       * @summary
       * based on moduleContent, prepare the module
       *
       * @memberOf XModuleContext#
       * @private
       * @instance
       * @method
       *
       * @param moduleContent {metaInfo:Object,content:Class|Interface}
       */
      function prepareModule (moduleContent) {
        var me = this
        if (_.isFunction(moduleContent.factoryFn)) {
          if (
            _.keys(moduleContent.metaInfo.imports).length > 0
          ) {
            return me.loadModules(moduleContent.metaInfo.imports).then(
              function (dependencies) {
                return moduleContent.factoryFn.apply(
                  me, validateAndAdjustArguments(dependencies,
                    moduleContent.factoryFn)
                )
              }
            )
          } else {
            return Q(moduleContent.factoryFn())
          }
        }
      }

      function validateAndAdjustArguments (args, fn) {
        var newArgs = []
        var functionInfo = _x.util.getInfoFromDeclaredFunction(fn)
        _.each(functionInfo.params,
          function (param, index) {
            var findIndex = _.findIndex(
              args, function (arg) {
                if (arg.getModuleContextPath().indexOf(param.name) !== -1) {
                  return true
                } else {
                  return false
                }
              }
            )
            if (findIndex !== -1) {
              newArgs.push(args[findIndex].getContent())
            } else {
              throw Error('Parameter "' + param.name +
                '" has no matched imported dependency')
            }
          }
        )
        return newArgs
      }

      /**
       * @summary
       * generate remote module path based on the module context configuration,
       * and the generated path is the URI which contains the protocol
       * at the begining
       *
       * @private
       * @instance
       * @memberOf! XModuleContext
       * @param packagePath
       * @param moduleName
       * @returns {string} - file resource uri
       */
      function generateRemoteModuleFilePath (modulePath) {
        return this.contextConfiguration.loader.basePath + '/' +
          modulePath.replace(/\./g, '/') + '.js'
      }

      /**
       * @summary
       * Load module files remotely
       * depends on the URI and loader configuration, the module files can be loaded
       * through different way, which includes WS and HTTP protocal
       *
       * @private
       * @static
       * @method
       * @param moduleFilePaths
       * @memberOf! XModuleContext#
       * @returns {Promise} - promise with the list of loadedFileContent in array
       * success or failure of promise :
       * [{ filePath:, isSuccess:,content:, errors: }]
       * progress of promise: TODO
       */
      function loadModuleFiles (modulesInfo) {
        var deferred = Q.defer()
        // key map structure, the key is used for storing the original sequence
        var loadedFilesContent = {}
        // returned data for the caller
        var returnedFilesData = []
        // proceedFileCount
        var processedSuccessFulFileNum = 0
        var processedFailedFileNum = 0
        var isReturned = false

        function getModuleContentByRunningSourceCodes (codes) {
          var bcodes
          var oScript
          var requestId = _x.util.getRandomString(10)
          var deferred = Q.defer()
          var checkerNum = 0
          bcodes = validateAndPrepareModuleCodes(codes, requestId)
          bcodes = window.btoa(bcodes)
          oScript = document.createElement('script')
          oScript.type = 'text/javascript'
          oScript.src = 'data:application/x-javascript;charset=UTF-8;base64,' +
            bcodes
          var checker = setInterval(function (eventInfo) {
            if (moduleParsedModules[requestId]) {
              if (
                _.isObject(moduleParsedModules[requestId].metaInfo) &&
                _.isFunction(moduleParsedModules[requestId].factoryFn)
              ) {
                deferred.resolve(moduleParsedModules[requestId])
                moduleParsedModules[requestId] = null
              } else {
                deferred.reject('Invalid module meta or factory function')
              }
              clearInterval(checker)
            } else {
              if (checkerNum > 1000) {
                logger.error(
                  'Unexpected timeout on getting module content from export function')
                clearInterval(checker)
              } else {
                checkerNum++
              }
            }
          }, 1)
          document.head.appendChild(oScript)
          return deferred.promise
        }

        function validateAndPrepareModuleCodes (codes, requestId) {
          var prefix = '_x.exportModule('
          var fcodes
          if (codes.substr(0, prefix.length) === prefix) {
            fcodes = prefix + '\'' +
              requestId + '\',' +
              codes.slice(prefix.length)
            return fcodes
          } else {
            throw Error('Invalide module content')
          }
        }

        function onFileLoadCompleted (fullPath, fileContent) {
          loadedFilesContent[fullPath] = {}
          getModuleContentByRunningSourceCodes(fileContent).then(
            function (moduleContent) {
              processedSuccessFulFileNum++
              loadedFilesContent[fullPath].moduleInfo =
                {
                  modulePath: fullPath,
                  isSuccess: true,
                  content: moduleContent
                }
            },
            function (errorInfo) {
              processedFailedFileNum++
              loadedFilesContent[fullPath].moduleInfo =
                {
                  modulePath: fullPath,
                  isSuccess: false,
                  errors: errorInfo
                }
            }
          ).fin(
            function () {
              checkCompletion()
            }
          )
        }

        function onFileLoadFail (fullPath, errorInfo) {
          loadedFilesContent[fullPath] = {}
          processedFailedFileNum++
          loadedFilesContent[fullPath].moduleInfo =
            {
              modulePath: fullPath,
              isSuccess: false,
              errors: errorInfo
            }
          checkCompletion()
        }

        function onFileLoadProgress (fileInfo, progress) {
          //todo
        }

        function prepareReturnData () {
          var infos = _.values(loadedFilesContent)
          var sortedInfos = _.sortBy(infos, 'order')
          _.each(sortedInfos,
            function (info, index) {
              returnedFilesData.push(info.moduleInfo)
            }
          )
        }

        function checkCompletion () {
          var me = this
          var processedFileNum = processedSuccessFulFileNum +
            processedFailedFileNum
          deferred.notify(processedFileNum + 1 / modulesInfo.length + 1)
          if (processedFileNum === modulesInfo.length && !isReturned) {
            prepareReturnData()
            if (processedFailedFileNum === 0) {
              deferred.resolve(returnedFilesData)
            } else {
              deferred.reject('Failed to load the module file')
            }
            isReturned = true
          }
        }

        if (!_.isEmpty(modulesInfo)) {
          modulesInfo = _x.util.asArray(modulesInfo)
          _.each(modulesInfo,
            function (moduleInfo, index, files) {
              logger.debug(
                'Load module info through file path:' + moduleInfo.filePath)
              loadedFilesContent[moduleInfo.fullPath] = {
                order: index,
                moduleInfo: null
              }
              WebResourceUtil.loadTextResource(
                moduleInfo.filePath,
                _.partial(onFileLoadCompleted, moduleInfo.fullPath),
                _.partial(onFileLoadFail, moduleInfo.fullPath),
                _.partial(onFileLoadProgress, moduleInfo.fullPath)
              )
            }, this
          )
        } else {
          return 0
        }
        return deferred.promise
      }

      XModuleContext = _x.createCls(
        {
          construct: function () {
            this.ctxPackage = XPackage.newInstance()
          },
          props: {
            ctxPackage: {
              __xConfig: true,
              type: XPackage
            },
            parentContext: null,
            loadingModules: {},
            contextConfiguration: {
              loader: {
                basePath: ''
              }
            }
          },
          staticMethods: {
            /**
             * @public
             * @method
             * @name createModuleContext
             * @memberOf XModuleContext#
             * @static
             * @returns {XModuleContext}
             */
            createModuleContext: [
              function () {
                return new XModuleContext()
              },
              function (parentCtx) {
                var ctx = new XModuleContext()
                ctx.setParentContext(parentCtx)
                return ctx
              },
              function (configs) {
                var ctx = new XModuleContext()
                ctx.setCtxConfiguration(configs)
                return ctx
              },
              function (parentCtx, configs) {
                var ctx = new XModuleContext()
                ctx.setCtxConfiguration(configs)
                ctx.setParentContext(parentCtx)
                return ctx
              }
            ],
            /**
             * @memberOf XModuleContext#
             * @public
             * @staic
             * @method
             * @returns {Object} - path in details
             */
            parseName: function (fullName) {
              if (_.isString(fullName) && !_.isEmpty(fullName)) {
                var paths = fullName.split('.')
                var moduleName
                var packagePath = ''
                moduleName = _.last(paths)
                if (paths.length > 1) {
                  packagePath = _.first(paths, paths.length - 1).join('.')
                }
                return {
                  packagePath: packagePath,
                  moduleName: moduleName
                }
              } else {
                throw Error('XModule path name "' + fullName + '" is invalid')
              }
            }
          },
          methods: {
            /**
             * @memberOf XModuleContext#
             * @public
             * @instance
             * @method
             */
            setParentContext: function (parentCtx) {
              this.parentContext = parentCtx
            },
            setCtxConfiguration: function (configuration) {
              _x.util.assignOwnProperty(
                this.contextConfiguration, configuration
              )
            },
            getContextPackage: function () {
              return this.ctxPackage
            },
            setLoaderConfig: function (config) {
              if (_.isObject(config) && _.isString(config.urlRoot)) {
                this.moduleLoaderConfig.urlRoot = config.urlRoot
              }
            },
            /**
             * @memberOf XModuleContext#
             * @public
             * @instance
             * @method
             * @param libFiles
             * @returns {*|PromiseLike<T | never>|Promise<T | never>}
             */
            loadLibs: function (libFiles) {
              var me = this
              return Q.when(loadModuleFiles(libFiles)).then(
                function (files) {
                  return files
                }
              )
            },
            /**
             * @memberOf XModuleContext#
             * @public
             * @instance
             * @method
             * @param packagePath
             * @param moduleName
             * @returns {*|PromiseLike<T | never>|Promise<T | never>}
             */
            loadModule: [
              function (packagePath, modulePath) {
                return this.loadModule(packagePath + modulePath)
              },
              function (moduleFilePath) {
                return this.loadModules([moduleFilePath]).then(
                  function (modules) {
                    return modules[0]
                  },
                  function (errors) {
                    throw Error('Failed to load module path: ' +
                      moduleFilePath + ' because of ' +
                      errors
                    )
                  }
                )
              }
            ],
            loadModules: function (mFilePaths) {
              var me = this
              var moduleFilePaths = []
              var loadingModules = []
              _.each(mFilePaths,
                function (modulePath, index) {
                  var moduleLoading = me.loadingModules[modulePath]
                  if (me.hasModule(modulePath)) {
                    loadingModules.push(me.getModule(modulePath))
                  } else if (
                    moduleLoading &&
                    (moduleLoading.status === 1 || moduleLoading.status === 2)
                  ) {
                    loadingModules.push(moduleLoading.promise)
                  } else {
                    loadingModules.push(
                      generateLoadingModulePromise.call(me, modulePath)
                    )
                  }
                }
              )
              return Q.all(loadingModules)
            },
            register: [
              function (fullName, moduleContent) {
                var pathInfo = XModuleContext.parseName(fullName)
                return this.register(pathInfo.packagePath, pathInfo.moduleName,
                  moduleContent)
              },
              function (packagePath, moduleName, moduleContent) {
                var packagePaths = packagePath.split('.')
                var currentPackage = this.ctxPackage
                _.each(packagePaths, function (packageName) {
                  if (!_.isEmpty(packageName)) {
                    if (!currentPackage.hasPackage(packageName)) {
                      currentPackage = currentPackage.addPackage(packageName)
                    } else {
                      currentPackage = currentPackage.getRootPackage(
                        packageName)
                    }
                  }
                }, this)
                if (currentPackage.hasModule(moduleName)) {
                  // todo
                  // need to make decision about whehter need to throw exception later
                  // throw new Error('XModule name "' + moduleName + '" has existed in the xPackage "' + packagePath)
                } else {
                  currentPackage.addModule(moduleName, moduleContent)
                  moduleContent.setModuleContextPath(
                    packagePath + '.' + moduleName)
                }
              }
            ],
            hasPackage: function (packagePath) {
              var packagePaths = packagePath.split('.')
              var currentPackage = this.ctxPackage
              return _.every(packagePaths, function (eachPackagePath) {
                if (_.has(currentPackage.packages, eachPackagePath)) {
                  currentPackage = currentPackage.packages[eachPackagePath]
                  return true
                } else {
                  return false
                }
              }, this)
            },
            getRootPackage: function (packagePath) {
              if (_.isEmpty(packagePath)) {
                return this.ctxPackage
              }
              var packagePaths = packagePath.split('.')
              var currentPackage = this.ctxPackage
              _.each(packagePaths, function (eachPackagePath) {
                if (_.has(currentPackage.packages, eachPackagePath)) {
                  currentPackage = currentPackage.packages[eachPackagePath]
                } else {
                  throw Error('XPackage "' + packagePath + '" is not found')
                }
              }, this)
              return currentPackage
            },
            removeModule: [
              function (fullName) {
                var info = XModuleContext.parseName(fullName)
                return this.removeModule(info.packagePath, info.moduleName)
              },
              function (packagePath, moduleName) {
                var xPackage = this.getRootPackage(packagePath)
                if (xPackage && xPackage.hasModule(moduleName)) {
                  xPackage.removeModule(moduleName)
                }
              }
            ],
            getModule: [
              function (fullName) {
                var info = XModuleContext.parseName(fullName)
                return this.getModule(info.packagePath, info.moduleName, false)
              },
              function (fullName, tryRemote) {
                var info = XModuleContext.parseName(fullName)
                return this.getModule(info.packagePath, info.moduleName,
                  tryRemote)
              },
              function (packagePath, moduleName, tryRemote) {
                var me = this
                var xPackage = this.getRootPackage(packagePath)
                tryRemote = Boolean(tryRemote)
                if (xPackage.hasModule(moduleName) && !tryRemote) {
                  return xPackage.modules[moduleName]
                } else {
                  //todo
                }
              }
            ],
            hasModule: [
              function (fullName) {
                var info = XModuleContext.parseName(fullName)
                return this.hasModule(info.packagePath, info.moduleName)
              },
              function (packagePath, moduleName) {
                var xPackage
                if (this.hasPackage(packagePath)) {
                  xPackage = this.getRootPackage(packagePath)
                  if (!xPackage) {
                    logger.warn(
                      'The package path ' + packagePath + ' doesn\'t exist ')
                  }
                  if (xPackage.hasModule(moduleName)) {
                    return true
                  } else {
                    logger.warn('The module ' + packagePath + '.' + moduleName +
                      ' doesn\'t exist ')
                    return false
                  }
                } else {
                  return false
                }
              }
            ]
          }
        }
      )

      // mount API
      root.createModuleContext = function (parentCtx) {
        return XModuleContext.createModuleContext.apply(XModuleContext,
          arguments)
      }
    }

    /**
     * @class XSystem
     */
    function enableSystem () {
      /**
       * @static
       * @memberOf XSystem
       */
      var configuration = {}

      function loadDefaultConfiguration () {
        //todo
      }

      function startDefaultApp () {
        var mainAppInfo = this.getConfigValue('mainAppInfo')
        var systemDefaultApp = XApp.newInstance(mainAppInfo)
        if (!_.isNull(systemDefaultApp)) {
          return systemDefaultApp.initialize().then(
            function (systemDefaultApp) {
              return Q.when(systemDefaultApp.main()).then(
                function () {
                  return systemDefaultApp
                }
              )
            },
            function (errors) {
              throw Error(errors)
            }
          )
        } else {
          throw Error('mainAppClassName is not defined')
        }
      }

      XSystem = _x.createCls(
        {
          props: {
            systConfiguration: {}
          },
          construct: function () {
            this._callParent('xSystem')
          },
          methods: {
            init: function () {
              var me = this
              var bootLibs, extendedLibs

              return Q.when(loadDefaultConfiguration()).then(
                function () {
                  bootLibs = me.getConfigValue('systemInfo.bootLibPath')
                  return Q.when(me.loadLibs(bootLibs))
                }
              ).then(
                function () {
                  extendedLibs = me.getConfigValue('systemInfo.extLibPath')
                  return Q.when(me.loadLibs(extendedLibs))
                }
              ).then(
                function () {
                  return startDefaultApp.call(me)
                }
              ).catch(
                function (errors) {
                  console.error(
                    'Failed to initialize the xSystem, caused by:' + errors)
                  throw Error(errors)
                }
              )
            },
            setSystConfiguration: function (configuration) {
              _.extendOwn(this.systConfiguration, configuration)
            },
            setSystConfigurationByKeyValue: function (key, value) {

            },
            getConfigValue: function (keyPath) {
              return _.property(keyPath.split('.'))(this.systConfiguration)
            }
          }
        }
        , XModuleContext
      )

      // mount API to the root
      root.getSystem = function () {
        return xSystem
      }

      xSystem = XSystem.newInstance()
    }

    /**
     * @class XApp
     */
    function enableApplication () {
      function identifyAppEntryClass () {
        var entryClassNames = this.appConfiguration.entryClassNames
        var firstModule
        if (entryClassNames.length > 0) {
          firstModule = this.getModule(this.appConfiguration.entryClassNames[0],
            false)
          return firstModule.getClass()
        } else {
          throw Error(
            'Unable to identify application entry class because appConfiguration.' +
            'entryClassNames are invalids')
        }
      }

      XApp = _x.createCls(
        {
          construct: [
            function (appConfig) {
              this._callParent()
              this.setAppConfiguration(appConfig)
              this.setCtxConfiguration(appConfig)
            }
          ],
          props: {
            appConfiguration: {
              basePath: null,
              entryClassNames: 'mainApp'
            },
            mAppClass: null,
            mAppInstance: null,
            appModulePaths: null,
            mLoader: null
          },
          staticMethods: {
            createAppInstance: function () {
              return XApp.newInstance()
            }
          },
          methods: {
            initialize: function () {
              var me = this
              return this.initAppContext().then(
                function () {
                  me.mAppClass = identifyAppEntryClass.call(me)
                  return me.mAppClass
                }
              ).catch(
                function (error) {
                  logger.error('Fail to load entry classes, because:' + error)
                  throw new Error(
                    'Failed to initialize application context on loading the entry class')
                }
              )
            },
            setAppConfiguration: function (appConfig) {
              _x.util.assignOwnProperty(
                this.appConfiguration, appConfig,
                function (val, key) {
                  if (key === 'entryClassNames') {
                    return _.isArray(val) ? val : val.split(',')
                  }
                  return val
                }
              )
            },
            initAppContext: function () {
              var me = this
              return me.loadModules(
                _x.util.asArray(me.appConfiguration.entryClassNames))
            },
            start: function () {
              return this.mAppClass.main()
            }
          }
        }
        , XModuleContext
      )

      // mount API to root
      root.createApp = function () {
        return XApp.createAppInstance.call(arguments)
      }

      root.exportModule = XModule.exportModule
    }

    function init () {
      prepareCommon()
      enableModule()
      enableModuleContext()
      enablePackage()
      enableApplication()
      enableSystem()
    }

    function postProcess () {
      root.feature.isSystemEnabled = true
    }

    var checkResult = _x.util.dependencyChecker.check(dependencies)
    if (checkResult.length !== 0) {
      throw Error(
        'Dependency check failed because :\n' + checkResult.join('\n'))
    }

    Q.when(init()).then(
      postProcess
    )
  }

)()
