/* eslint-disable no-unused-vars,spaced-comment */
(
  function () {
    var MODULE_TYPE = {
      PROGRAM_MODULE: 'PROGRAM_MODULE',
      BOOT_MODULE: 'BOOT_MODULE',
      EXT_MODULE: 'EXT_MODULE'
    }
    var APP_FILE_DB_VERSION = 1
    var APP_FILE_DB_NAME = 'app_file_db'
    var APP_FILE_STORE_NAME = 'app_file_store'
    var root = _x
    var XModule, XPackage, XModuleContext, XProgram, XVM
    var rootVM
    var WebResourceUtil
    var vmDB
    var logger
    var dependencies = {
      'core': {
        checkFn: function () {
          return _x && _x.features.isLangCore && (window.indexedDB)
        }
      }
    }

    var moduleParsedModules = {}

    function prepareCommon () {
      logger = _x.util.logger
      WebResourceUtil = (function () {
        function storeResource (url, codes) {
          vmDB.files.put(
            {
              filePath: url,
              content: codes
            }
          )
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
                    storeResource(url, response.data)
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

    function enableVMDB () {
      try {
        vmDB = new Dexie('vmDb')
        vmDB.version(1).stores(
          {
            files: '++id,filePath'
          }
        )
      } catch (e) {
        logger.error('failed to setup the VM DB because:' + e.getMessage())
      }
    }

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
        _.forEach(metaExtraction, function (metaExtractor, key) {
          var extractionResult = metaExtractor(info)
          if (extractionResult.errors.length === 0) {
            metaInfo[key] = extractionResult.result
          } else {
            errors.push(extractionResult.errors.join('\n'))
          }
        })
        return {
          metaInfo: metaInfo,
          errors: errors
        }
      }

      /**
       * @class XModule
       */
      XModule = _x.createCls(
        {
          props: {
            content: {
              _xConfig: true,
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
              if (this.content.isCustomClass) {
                return this.content
              } else {
                throw Error('XModule content is not class')
              }
            },
            getInterface: function () {
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

    function enablePackage () {
      /**
       * @class XPackage
       */
      XPackage = _x.createCls(
        {
          props: {
            modules: {},
            packages: {}
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
       * @param modulePath
       */
      function generateLoadingModulePromise (modulePath, moduleType) {
        var me = this
        var deferred = Q.defer()
        var loadingModuleInfo = {
          status: 0,
          rawContent: null,
          moduleType: moduleType,
          modulePath: modulePath,
          promise: deferred.promise
        }
        me.loadingModules[modulePath] = loadingModuleInfo
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
            filePath: generateRemoteModuleFilePath.call(
              me,
              loadingModuleInfo.modulePath,
              me.moduleType
            ),
            fullPath: loadingModuleInfo.modulePath
          }
        )
        loadingModuleInfo.status = 1
        return loadModuleFiles.call(me, moduleFilePaths).then(
          function (modulesContent) {
            var loadedModuleRawContent = modulesContent[0]
            if (!loadedModuleRawContent.isSuccess) {
              loadingModuleInfo.status = 5
              throw Error(
                'Failed to load module:' + loadedModuleRawContent.modulePath)
            }
            loadingModuleInfo.status = 2
            loadingModuleInfo.rawContent = loadedModuleRawContent.content
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
        _.forEach(functionInfo.params,
          function (param, index) {
            var findIndex = _.findIndex(
              args, function (arg) {
                return _.includes(arg.getModuleContextPath(), param.name)
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
       * at the beginning
       *
       * @private
       * @instance
       * @memberOf! XModuleContext
       * @returns {string} - file resource uri
       * @param modulePath
       */
      function generateRemoteModuleFilePath (modulePath, moduleType) {
        var path = ''
        switch (moduleType) {
          case MODULE_TYPE.BOOT_MODULE:
            path = rootVM.getConfigValue('loader.bootPath')
            break
          case MODULE_TYPE.EXT_MODULE:
            path = rootVM.getConfigValue('loader.extPath')
            break
          case MODULE_TYPE.PROGRAM_MODULE:
            path = this.getConfigValue('loader.basePath')
            break
        }
        return path + '/' + _.replace(modulePath, /\./g, '/') + '.js'
      }

      /**
       * @summary
       * Save the the remote content to DB
       *
       * @private
       * @static
       * @memberOf XModuleContext
       * @param fullPath
       * @param content
       */
      function saveFileToLocalDB (fullPath, content) {

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
       * @memberOf! XModuleContext#
       * @returns {Promise} - promise with the list of loadedFileContent in array
       * success or failure of promise :
       * [{ filePath:, isSuccess:,content:, errors: }]
       * progress of promise: TODO
       * @param modulesInfo
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
          var checker = setInterval(function () {
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
          returnedFilesData = _.union(returnedFilesData,
            _.map(sortedInfos, 'moduleInfo')
          )
        }

        function checkCompletion () {
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
          _.forEach(modulesInfo,
            function (moduleInfo, index) {
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
            }
          )
        } else {
          return Q()
        }
        return deferred.promise
      }

      /**
       * @class XModuleContext
       */
      XModuleContext = _x.createCls(
        {
          construct: [
            function () {
              this.ctxPackage = XPackage.newInstance()
            },
            function (moduleType) {
              this.moduleType = moduleType
              this._construct()
            },
            function (parentCtx, moduleType) {
              this.parentContext = parentCtx
              this._construct(moduleType)
            }
          ],
          props: {
            ctxPackage: {
              _xConfig: true,
              type: XPackage
            },
            moduleType: null,
            parentContext: null,
            loadingModules: {},
            contextConfiguration: {
              loader: {
                basePath: '',
                bootPath: '',
                extPath: ''
              }
            }
          },
          staticMethods: {
            /**
             * @memberOf XModuleContext#
             * @public
             * @static
             * @method
             * @param context
             * @param libFiles
             * @param moduleType
             * @returns PromiseLike<ModuleContext>
             */
            loadContextModules: function (context, libFiles) {
              return context.loadModules(libFiles)
            },
            /**
             * @memberOf XModuleContext#
             * @public
             * @static
             * @method
             * @returns {Object} - path in details
             */
            parseName: function (fullName) {
              if (_.isString(fullName) && !_.isEmpty(fullName)) {
                var paths = _.split(fullName, '.')
                var moduleName
                var packagePath = ''
                moduleName = _.last(paths)
                if (paths.length > 1) {
                  packagePath = _.take(paths, paths.length - 1).join('.')
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
            setConfiguration: function (config) {
              _.assign(
                this.configuration,
                config,
                _.pick(
                  config, _.keys(this.constructor)
                )
              )
            },
            getConfigValue: function (keyPath) {
              return _.property(_.split(keyPath, '.'))(this.configuration)
            },
            getContextPackage: function () {
              return this.ctxPackage
            },
            /**
             * @summary
             * Load the modules from physical into context
             *
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
            /**
             * @memberOf XModuleContext#
             * @public
             * @instance
             * @method
             * @param mFilePaths modules file path
             * @param moduleType
             * @returns {*|PromiseLike<T | never>|Promise<T | never>}
             */
            loadModules:
              [
                function (mFilePaths) {
                  var me = this
                  var loadingModules = []
                  _.forEach(mFilePaths,
                    function (modulePath, index) {
                      var moduleLoading = me.loadingModules[modulePath]
                      var loadedModule = me.getModule(modulePath)
                      if (!_.isNull(loadedModule)) {
                        loadingModules.push(loadedModule)
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
                }
              ],
            register: [
              function (fullName, moduleContent) {
                var pathInfo = XModuleContext.parseName(fullName)
                return this.register(pathInfo.packagePath, pathInfo.moduleName,
                  moduleContent)
              },
              function (packagePath, moduleName, moduleContent) {
                var packagePaths = _.split(packagePath, '.')
                var currentPackage = this.ctxPackage
                _.forEach(packagePaths, function (packageName) {
                  if (!_.isEmpty(packageName)) {
                    if (!currentPackage.hasPackage(packageName)) {
                      currentPackage = currentPackage.addPackage(packageName)
                    } else {
                      currentPackage = currentPackage.getRootPackage(
                        packageName)
                    }
                  }
                })
                if (currentPackage.hasModule(moduleName)) {
                  // todo
                  // need to make decision about whether need to throw exception later
                  // throw new Error('XModule name "' + moduleName + '" has existed in the xPackage "' + packagePath)
                } else {
                  currentPackage.addModule(moduleName, moduleContent)
                  moduleContent.setModuleContextPath(
                    packagePath + '.' + moduleName)
                }
              }
            ],
            hasPackage: function (packagePath) {
              var packagePaths = _.split('.')
              var currentPackage = this.ctxPackage
              return _.every(packagePaths, function (eachPackagePath) {
                if (_.has(currentPackage.packages, eachPackagePath)) {
                  currentPackage = currentPackage.packages[eachPackagePath]
                  return true
                } else {
                  return false
                }
              })
            },
            getRootPackage: function (packagePath) {
              if (_.isEmpty(packagePath)) {
                return this.ctxPackage
              }
              var packagePaths = _.split(packagePath, '.')
              var currentPackage = this.ctxPackage
              _.forEach(packagePaths, function (eachPackagePath) {
                if (_.has(currentPackage.packages, eachPackagePath)) {
                  currentPackage = currentPackage.packages[eachPackagePath]
                } else {
                  return null
                }
              })
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
              /**
               * @name getModule
               * @memberOf XModuleContext#
               * @public
               * @instance
               * @method
               * @param fullName
               * @returns {XModule}
               */
              function (fullName) {
                var info = XModuleContext.parseName(fullName)
                return this.getModule(info.packagePath, info.moduleName)
              },
              /**
               * @name getModule
               * @memberOf XModuleContext#
               * @public
               * @instance
               * @method
               * @param packagePath
               * @param moduleName
               * @returns {XModule}
               */
              function (packagePath, moduleName) {
                var foundModule = null
                if (!_.isNull(this.parentContext)) {
                  foundModule = this.parentContext.getModule(packagePath, moduleName)
                }
                if (_.isNull(foundModule)) {
                  var xPackage = this.getRootPackage(packagePath)
                  if (!_.isNull(xPackage) && xPackage.hasModule(moduleName)) {
                    foundModule = xPackage.modules[moduleName]
                  }
                }
                return foundModule
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
      root.createModuleContext = function () {
        return XModuleContext.newInstance(arguments)
      }
    }

    function enableVM () {
      /**
       * @static
       * @memberOf XVM
       */
      var configuration = {}

      function loadDefaultConfiguration () {
        //todo
      }

      /**
       * @memberOf XVM
       *
       * @private
       * @instance
       * @returns {*|PromiseLike<T | never>|Promise<T | never>}
       */
      function startDefaultProgram () {
        var systemDefaultProgram = XProgram.newInstance(this.mainProgramConfiguration)
        this.mainProgramInstance = systemDefaultProgram
        var mProgramClass
        if (!_.isNull(systemDefaultProgram)) {
          return systemDefaultProgram.initialize().then(
            function (mainProgramClass) {
              mProgramClass = mainProgramClass
              return Q(mainProgramClass.main())
            },
            function (errors) {
              throw Error('System initialization failed: ' + errors)
            }
          ).then(
            function () {
              return mProgramClass
            },
            function (reason) {
              throw Error('Entry main method execution failed: ' + reason)
            }
          )
        } else {
          throw Error('mainProgramClassName is not defined')
        }
      }

      /**
       * @class XVM
       */
      XVM = _x.createCls(
        {
          props: {
            configuration: {},
            mainProgramConfiguration: {},
            mainProgramInstance: null
          },
          staticProps: {
            bootContext: null,
            extContext: null
          },
          methods: {
            setConfiguration: function (configuration) {
              _.assign(this.configuration, configuration.vmInfo)
              _.assign(this.mainProgramConfiguration, configuration.mainProgramInfo)
            },
            getConfigValue: function (keyPath) {
              return _.property(_.split(keyPath, '.'))(this.configuration)
            },
            init: function () {
              var me = this
              var bootModules, extModules
              var bootContext, extContext

              bootContext = XModuleContext.newInstance(MODULE_TYPE.BOOT_MODULE)
              extContext = XModuleContext.newInstance(bootContext, MODULE_TYPE.EXT_MODULE)

              return Q.when(loadDefaultConfiguration()).then(
                function () {
                  bootModules = me.getConfigValue('bootModules')
                  return XModuleContext.loadContextModules(
                    bootContext, bootModules
                  )
                }
              ).then(
                function () {
                  me.$.bootContext = bootContext
                  extModules = me.getConfigValue('extModules')
                  return XModuleContext.loadContextModules(
                    extContext, extModules
                  )
                }
              ).then(
                function () {
                  me.$.extContext = extContext
                  return startDefaultProgram.call(me)
                }
              ).catch(
                function (errors) {
                  console.error(
                    'Failed to initialize the rootVM, caused by:' + errors)
                  throw Error(errors)
                }
              )
            }
          }
        }
      )

      // mount API to the test_1
      root.getRootVM = function () {
        return rootVM
      }

      rootVM = XVM.newInstance()
    }

    /**
     * @class XProgram
     */
    function enableProgram () {
      function identifyProgramEntryClass () {
        var entryClassNames = _x.util.asArray(this.configuration.entryClassName)
        var firstModule
        if (entryClassNames.length > 0) {
          firstModule = this.getModule(
            entryClassNames[0]
          )
          return firstModule.getClass()
        } else {
          throw new Error(
            'Unable to identify application entry class because appConfiguration.' +
            'entryClassNames can not be empty')
        }
      }

      XProgram = _x.createCls(
        {
          construct: [
            function (appConfig) {
              this._callParent(XVM.$.extContext, MODULE_TYPE.PROGRAM_MODULE)
              this.setConfiguration(appConfig)
            }
          ],
          props: {
            configuration: {
              basePath: null,
              entryClassName: ''
            },
            mProgramClass: null,
            mProgramInstance: null,
            appModulePaths: null,
            mLoader: null
          },
          staticMethods: {
            createProgramInstance: function () {
              return XProgram.newInstance()
            }
          },
          methods: {
            initialize: function () {
              var me = this
              return this.initProgramContext().then(
                function () {
                  me.mProgramClass = identifyProgramEntryClass.call(me)
                  return me.mProgramClass
                }
              ).catch(
                function (error) {
                  logger.error('Fail to load entry classes, because:' + error)
                  throw new Error(
                    'Failed to initialize application context on loading the entry class')
                }
              )
            },
            initProgramContext: function () {
              var me = this
              return me.loadModules(
                _x.util.asArray(me.configuration.entryClassName))
            },
            start: function () {
              return this.mProgramClass.main()
            }
          }
        }
        , XModuleContext
      )

      // mount API to test_1
      root.createProgram = function () {
        return XProgram.createProgramInstance.call(arguments)
      }

      root.exportModule = XModule.exportModule
    }

    function initVM () {
      return Q.when(prepareCommon())
      .then(enableVMDB)
      .then(enableModule)
      .then(enableModuleContext)
      .then(enablePackage)
      .then(enableProgram)
      .then(enableVM)
    }

    function postProcess () {
      root.features.isSystemEnabled = true
    }

    var checkResult = _x.util.dependencyChecker.check(dependencies)
    if (checkResult.length !== 0) {
      throw Error(
        'Dependency check failed because :\n' + checkResult.join('\n'))
    }

    root.initVM = function () {
      if (!root.features.isSystemEnabled) {
        return Q.when(initVM())
        .then(postProcess)
      } else {
        return Q()
      }
    }
  }
)()
