/* eslint-disable no-unused-vars,spaced-comment */
(
  function () {
    var MODULE_TYPE = {
      PROGRAM_MODULE: 'PROGRAM_MODULE',
      BOOT_MODULE: 'BOOT_MODULE',
      EXT_MODULE: 'EXT_MODULE'
    }
    var FILE_TYPE = {
      MODULE: 'MODULE',
      LIB: 'LIB'
    }
    var MODULE_LOADING_STATUS = {
      'NOT_STARTED': 0,
      'LOADING_REMOTE_FILE': 1,
      'PARSING_MODULE_CONTENT': 2,
      'COMPLETED': 3,
      'FAILED': 4
    }
    var LIB_LOADING_STATUS = {
      'NOT_STARTED': 0,
      'LOADING_REMOTE_FILE': 1,
      'LOADING_MODULE_CONTENT': 2,
      'COMPLETED': 3,
      'FAILED': 4
    }
    var MODULE_LOADING_TIMEOUT = 1000 * 10
    var LIB_LOADING_TIMEOUT = 1000 * 60

    var root = _x
    var XModule, XPackage, XModuleContext, XProgram, XVM
    var rootVM
    var WebResourceUtil, DBUtil
    var systemDB
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
      DBUtil = {
        localizeContextModuleCodes: function (contextId, modulePath, url) {
          var defer = Q.defer()
          logger.debug('Localizing the resource [' + modulePath + '@' + contextId + '] from remote URL ' + url)
          WebResourceUtil.loadTextResource(
            url,
            function (codes) {
              systemDB.moduleCodes.put(
                {
                  moduleId: _x.util.generateUUID(),
                  contextId: contextId,
                  modulePath: modulePath,
                  content: codes
                }
              ).then(
                function () {
                  defer.resolve(codes)
                },
                function (reason) {
                  throw new Error(('Failed to storing the module codes into indexDB because:' + reason))
                }
              )
            },
            function (error) {
              console.log(
                'Failed to read remote module ' +
                modulePath + 'from url' +
                url + ' for context ' + contextId +
                ' because :' + error
              )
              defer.reject()
              throw new Error(error)
            }
          )
          return defer.promise
        },
        getContextModuleCodes: function (contextId, modulePath) {
          return systemDB.moduleCodes
          .where('[contextId+modulePath]').equals([contextId, modulePath])
          .toArray()
        },
        localizeContextLibCodes: function (contextId, libPath, url) {
          var me = this
          var defer = Q.defer()
          var libId = _x.util.generateUUID()
          var libCodes
          logger.debug('Localizing the resource [' + libPath + '@' + contextId + '] from remote URL ' + url)
          WebResourceUtil.loadTextResource(
            url,
            function (codes) {
              libCodes = codes
              systemDB.libCodes.put(
                {
                  libId: libId,
                  contextId: contextId,
                  libPath: libPath,
                  content: codes
                }
              ).then(
                function () {
                  return me.localizeContextLibMetaCodes(contextId, libPath, url)
                },
                function (reason) {
                  throw new Error(reason)
                }
              ).then(
                function () {
                  defer.resolve(libCodes)
                }
              ).catch(
                function (reason) {
                  logger.error('Failed to localize lib codes because:' + reason)
                }
              )
            },
            function (error) {
              console.log(
                'Failed to read remote library codes ' +
                libPath + 'from url' +
                url + ' for context ' + contextId +
                ' because :' + error
              )
              defer.reject(error)
            }
          )
          return defer.promise
        },
        localizeContextLibMetaCodes: function (contextId, libPath, url) {
          return Q.Promise(function (resolve, reject, notify) {
            var libMetaId = _x.util.generateUUID()
            url = _.replace(url, '.xlib', '.xmeta')
            logger.debug('Localizing the resource meta [' + libPath + '@' + contextId + '] from remote URL ' + url)
            WebResourceUtil.loadTextResource(
              url,
              function (codes) {
                systemDB.libMetaCodes.put(
                  {
                    libMetaId: libMetaId,
                    contextId: contextId,
                    libPath: libPath,
                    content: codes
                  }
                ).then(
                  function () {
                    resolve(codes)
                  },
                  function (error) {
                    throw new Error(error)
                  }
                )
              },
              function (error) {
                console.log(
                  'Failed to read remote library meta data' +
                  libPath + 'from url' +
                  url + ' for context ' + contextId +
                  ' because :' + error
                )
                reject(error)
              }
            )
          })
        },
        getContextLibCodes: function (contextId, libPath) {
          return systemDB.libCodes
          .where('[contextId+libPath]').equals([contextId, libPath])
          .toArray()
        },
        getContextLibMetaCodes: function (contextId, libPath) {
          return systemDB.libMetaCodes
          .where('[contextId+libPath]').equals([contextId, libPath])
          .toArray()
        }
      }
      WebResourceUtil = {
        loadTextResource: function (url, onSuccess, onFail, onProgress) {
          logger.info('Load text resource from url:' + url)
          axios.get(
            url,
            {
              onDownloadProgress: function (progressEvent) {
                if (_.isFunction(onProgress)) {
                  onProgress(progressEvent)
                }
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
    }

    function enableDB () {
      var defer = Q.defer()
      try {
        systemDB = new Dexie('xwebjs_system')
        systemDB.version(1).stores(
          {
            moduleCodes: 'moduleId,[contextId+modulePath]',
            libCodes: 'libId,[contextId+libPath]',
            libMetaCodes: 'libMetaId,[contextId+libPath]'
          }
        )
        systemDB.on(
          'ready',
          function () {
            defer.resolve()
          }
        )
        systemDB.open()
        return defer.promise
      } catch (error) {
        logger.error('Failed to setup the system index DB because:' + error.getMessage())
        throw new Error(error)
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
             * @description
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
            /**
             * @param requestId
             * @param metaInfo
             * @param factoryFn
             */
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
       * @description
       * Manage the library loading chain and generate promise for each loading library
       *
       * @memberOf XModuleContext
       * @private
       * @instance
       * @method
       *
       * @param libInfo
       */
      function processLoadingLib (libInfo) {
        var me = this
        var deferred = Q.defer()
        var loadingLibInfo = {
          status: LIB_LOADING_STATUS.NOT_STARTED,
          rawContent: undefined,
          fullPath: libInfo,
          promise: deferred.promise,
          type: FILE_TYPE.LIB
        }
        me.loadedLibs[libInfo.fullPath] = loadingLibInfo
        loadFile.call(me, loadingLibInfo, FILE_TYPE.LIB).then(
          function (loadingLibInfo) {
            var promiseFn = Q()
            _.forEach(
              _.keys(loadingLibInfo.rawContent),
              function (modulePath) {
                promiseFn = promiseFn.then(
                  function () {
                    return parseModuleContent.call(me,
                      {
                        rawContent: loadingLibInfo.rawContent[modulePath],
                        fullPath: modulePath
                      }
                    )
                  }
                )
              }
            )
            promiseFn.then(
              function () {
                deferred.resolve()
              }
            )
          }
        )
        return deferred.promise
      }

      /**
       * @description
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
      function processLoadingModule (modulePath) {
        var me = this
        var deferred = Q.defer()
        var loadingModuleInfo = {
          status: MODULE_LOADING_STATUS.NOT_STARTED,
          rawContent: undefined,
          fullPath: modulePath,
          promise: deferred.promise
        }
        me.loadingModules[modulePath] = loadingModuleInfo
        loadFile.call(me, loadingModuleInfo, FILE_TYPE.MODULE).then(
          function (loadingModuleInfo) {
            return parseModuleContent.call(me, loadingModuleInfo)
          }
        ).then(
          function (moduleContent) {
            // the reason for passing the module content
            // is for handling recursive importing scenario while referring to the
            // the dependent modules
            deferred.resolve(moduleContent)
          }
        ).catch(
          function (error) {
            loadingModuleInfo.status = MODULE_LOADING_STATUS.FAILED
            deferred.reject(error)
            logger.error(
              'Failed to generate loading module promise because:' + error)
          }
        )
        return deferred.promise
      }

      /**
       * @description
       * Load single module file from local DB / Remote server
       * it will firstly try to load the module codes from indexDB
       * if not available, it calls localizeModuleResources method to
       * localize the resource, once it is localized, it will return
       * the module or lib content back
       *
       * @memberOf XModuleContext
       * @private
       * @instance
       * @method
       *
       * @param loadingFileInfo
       * @param fileType FILE_TYPE
       * @return {Promise.<Object>}
       */
      function loadFile (loadingFileInfo, fileType) {
        var me = this
        var filesInfo = []
        filesInfo.push(
          {
            filePath: generateRemoteFilePath.call(
              me,
              loadingFileInfo.fullPath,
              me.moduleType,
              fileType
            ),
            fullPath: loadingFileInfo.fullPath,
            fileType: fileType
          }
        )
        if (fileType === FILE_TYPE.MODULE) {
          loadingFileInfo.status = MODULE_LOADING_STATUS.LOADING_REMOTE_FILE
        } else {
          loadingFileInfo.status = LIB_LOADING_STATUS.LOADING_REMOTE_FILE
        }
        return loadAndGetFilesContent.call(me, filesInfo).then(
          function (fileContents) {
            var loadedFileRawContent = fileContents[0]
            if (!loadedFileRawContent.isSuccess) {
              if (fileType === FILE_TYPE.MODULE) {
                loadingFileInfo.status = MODULE_LOADING_STATUS.FAILED
              } else {
                loadingFileInfo.status = LIB_LOADING_STATUS.FAILED
              }
              throw new Error(
                'Failed to load file:' + loadedFileRawContent.fullPath
              )
            }

            if (fileType === FILE_TYPE.MODULE) {
              loadingFileInfo.status = MODULE_LOADING_STATUS.PARSING_MODULE_CONTENT
            } else {
              loadingFileInfo.status = LIB_LOADING_STATUS.LOADING_MODULE_CONTENT
            }
            loadingFileInfo.rawContent = loadedFileRawContent.content
            return loadingFileInfo
          }
        )
      }

      function parseModuleContent (loadingModuleInfo) {
        var me = this
        return prepareModule.call(me, loadingModuleInfo.rawContent).then(
          function (preparedModuleContent) {
            var preparedModule = XModule.defineModule(
              {
                imports: loadingModuleInfo.rawContent.metaInfo.imports
              },
              preparedModuleContent
            )
            me.register(
              loadingModuleInfo.fullPath,
              preparedModule
            )
            loadingModuleInfo.status = MODULE_LOADING_STATUS.COMPLETED
            delete me.loadingModules[loadingModuleInfo.fullPath]
            return preparedModule
          }
        ).catch(
          function (error) {
            loadingModuleInfo.status = MODULE_LOADING_STATUS.FAILED
            logger.error(
              'Failed to parse the module content [' +
              loadingModuleInfo.fullPath +
              '] because: ' + error)
            throw new Error(
              'Fail to parse the module module [' +
              loadingModuleInfo.fullPath +
              '] ')
          }
        )
      }

      /**
       * @description
       * based on moduleContent, prepare the module
       *
       * @memberOf XModuleContext#
       * @private
       * @instance
       * @method
       *
       * @param moduleContent {Object}
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
          function (param) {
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
       * @description
       * generate remote module path based on the module context configuration,
       * and the generated path is the URI which contains the protocol
       * at the beginning
       *
       * @private
       * @instance
       * @memberOf! XModuleContext
       * @returns {string} - file resource uri
       * @param modulePath
       * @param contextType Context type
       * @param moduleLoadingType FILE_TYPE
       */
      function generateRemoteFilePath (modulePath, contextType, moduleLoadingType) {
        var path = ''
        switch (contextType) {
          case MODULE_TYPE.BOOT_MODULE:
            if (moduleLoadingType === FILE_TYPE.MODULE) {
              path = rootVM.getConfigValue('loader.bootPath')
            } else {
              path = rootVM.getConfigValue('loader.bootLibPath')
            }
            break
          case MODULE_TYPE.EXT_MODULE:
            if (moduleLoadingType === FILE_TYPE.MODULE) {
              path = rootVM.getConfigValue('loader.extPath')
            } else {
              path = rootVM.getConfigValue('loader.extLibPath')
            }
            break
          case MODULE_TYPE.PROGRAM_MODULE:
            if (moduleLoadingType === FILE_TYPE.MODULE) {
              path = this.getConfigValue('loader.basePath')
            } else {
              path = this.getConfigValue('loader.baseLibPath')
            }
            break
        }
        if (moduleLoadingType === FILE_TYPE.MODULE) {
          path = path + '/' + _.replace(modulePath, /\./g, '/') + '.js'
        } else {
          var pathInfo = _.split(modulePath, ':')
          path = path + '/' + _.replace(pathInfo[0], /\./g, '/') + '-' + pathInfo[1] + '.xlib'
        }
        return path
      }

      /**
       * @description
       * Load module files from local DB and interpret file content
       *
       * @private
       * @instance
       * @method
       * @memberOf! XModuleContext#
       * @param filesInfo {Array.<Object>}
       * @example
       * [
       *   {
       *     fullPath: shape.Circle
       *     fileType: FILE_TYPE.MODULE
       *   }
       * ]
       * @example
       * [
       *   {
       *     fullPath: boot:1.0
       *     fileType: FILE_TYPE.LIB
       *   }
       * ]
       * @returns {Promise.<Array.<Object>>} - promise with the list of loadedFileContent in array
       * @example
       * {
       *   fullPath: fullPath,
       *   isSuccess: false,
       *   errors: errorInfo
       *   content : content
       * }
       * when the file type is library, the attribute "content" will be the list of the module info
       * {
       *   fullPath: fullPath
       *   content: module content
       * }
       * progress of promise: TODO
       */
      function loadAndGetFilesContent (filesInfo) {
        var me = this
        var deferred = Q.defer()
        // key map structure, the key is full path, and value is object with order and moduleInfo
        var loadedFilesContent = {}
        // returned data for the caller
        var returnedFilesData = []
        // processedFileCount
        var processedSuccessFulFileNum = 0
        var processedFailedFileNum = 0
        var isReturned = false

        function onFileLoadCompleted (fileInfo, fileContent) {
          var fullPath = fileInfo.fullPath
          var getContentFn
          loadedFilesContent[fullPath] = {}
          if (fileInfo.fileType === FILE_TYPE.MODULE) {
            getContentFn = getModuleContentByRunningSourceCodes
          } else {
            getContentFn = getLibModulesContent
          }
          getContentFn.call(this, fullPath, fileContent).then(
            function (fileContent) {
              processedSuccessFulFileNum++
              loadedFilesContent[fullPath].loadedFileInfo =
                {
                  fullPath: fullPath,
                  isSuccess: true,
                  content: fileContent
                }
            },
            function (errorInfo) {
              processedFailedFileNum++
              loadedFilesContent[fullPath].loadedFileInfo =
                {
                  fullPath: fullPath,
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

        function onFileLoadFail (fileInfo, errorInfo) {
          var fullPath = fileInfo.fullPath
          logger.info('Failed to load remote file [' + fullPath + '] because:' + errorInfo)
          loadedFilesContent[fullPath] = {}
          processedFailedFileNum++
          loadedFilesContent[fullPath].loadedFileInfo =
            {
              fullPath: fullPath,
              isSuccess: false,
              errors: errorInfo
            }
          checkCompletion()
        }

        function onFileLoadProgress (fileInfo, progress) {
          //todo
        }

        /**
         *
         * @param fullPath
         * @return {Array.<Object>} moduleContents
         * @example
         * [{
         *   fullPath:'ui.circle',
         *   content: {....}
         * }]
         */
        function getLibModulesContent (fullPath) {
          return Q.Promise(function (resolve, reject) {
            getLibMetaContent(fullPath).then(
              function (libMeta) {
                getLibContentByRunningSourceCodes(
                  fullPath,
                  libMeta,
                  function (loadedModules) {
                    resolve(loadedModules)
                  },
                  function () {
                    reject('Timeout on getting modules in lib file')
                  }
                )
              }
            )
          })
        }

        function getLibMetaContent (fullPath) {
          return Q.Promise(function (resolve, reject, notify) {
            DBUtil.getContextLibMetaCodes(me.contextId, fullPath)
            .then(
              function (records) {
                if (records.length > 0) {
                  resolve(records[0].content)
                } else {
                  throw new Error('Failed to load lib meta data because of unknown issue')
                }
              }
            ).catch(
              function (error) {
                throw new Error('Failed to load lib meta data because :' + error)
              }
            )
          })
        }

        function getLibContentByRunningSourceCodes (fullPath, libMeta, onCompleted, onTimeout) {
          return Q.Promise(function (resolve, reject, notify) {
            var oScript
            var checkerNum = 0
            var libContextId = me.contextId + '/' + fullPath
            oScript = document.createElement('script')
            oScript.type = 'text/javascript'
            oScript.src = '/xwebjs_lib/' + me.contextId + '/' + fullPath
            var checker = setInterval(function () {
              var loadedModules = {}
              checkerNum++
              _.forEach(libMeta.modules,
                function (module, index) {
                  var loadedModule = checkModuleLoadingCompletion(me.contextId, fullPath, module.fullPath)
                  if (loadedModule.status === 1) {
                    loadedModules[module.fullPath] = loadedModule.content
                  } else if (loadedModule.status === 2) {
                    clearInterval(checker)
                    throw new Error(
                      'Invalid module content for loaded module' +
                      me.contextId + '.' + fullPath + '.' + module.fullPath
                    )
                  }
                }
              )
              if (libMeta.modules.length === _.keys(loadedModules).length) {
                clearInterval(checker)
                onCompleted(loadedModules)
              }
              if (checkerNum > LIB_LOADING_TIMEOUT) {
                throw new Error(
                  'Timeout for loading the remote library:' +
                  me.contextId + '.' + fullPath + '.' + module.fullPath
                )
              }
            }, 0)
            document.head.appendChild(oScript)
          })
        }

        function getModuleContentByRunningSourceCodes (fullPath) {
          var oScript
          var deferred = Q.defer()
          var checkerNum = 0
          oScript = document.createElement('script')
          oScript.type = 'text/javascript'
          oScript.src = '/xwebjs_module/' + me.contextId + '/' + fullPath
          var checker = setInterval(function () {
            var requestId = 'xwebjs.' + me.contextId + '.' + _.replace(fullPath, '/', '.')
            if (moduleParsedModules[requestId]) {
              if (
                _.isObject(moduleParsedModules[requestId].metaInfo) &&
                _.isFunction(moduleParsedModules[requestId].factoryFn)
              ) {
                deferred.resolve(moduleParsedModules[requestId])
                delete moduleParsedModules[requestId]
              } else {
                throw new Error('Invalid module meta or factory function when parsing the remote module:' + requestId)
              }
              clearInterval(checker)
            } else {
              if (checkerNum > MODULE_LOADING_TIMEOUT) {
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

        function checkModuleLoadingCompletion (contextId, libPath, modulePath) {
          var requestId = contextId + '.' + libPath + '.' + modulePath
          var moduleContent
          if (moduleParsedModules[requestId]) {
            if (
              _.isObject(moduleParsedModules[requestId].metaInfo) &&
              _.isFunction(moduleParsedModules[requestId].factoryFn)
            ) {
              moduleContent = moduleParsedModules[requestId]
              delete moduleParsedModules[requestId]
              return {
                content: moduleContent,
                status: 1
              }
            } else {
              return {
                error: 'Invalid module meta or factory function',
                status: 2
              }
            }
          } else {
            return {
              status: 0
            }
          }
        }

        function prepareReturnData () {
          var infos = _.values(loadedFilesContent)
          var sortedInfos = _.sortBy(infos, 'order')
          returnedFilesData = _.union(
            returnedFilesData,
            _.map(sortedInfos, 'loadedFileInfo')
          )
        }

        function checkCompletion () {
          var processedFileNum = processedSuccessFulFileNum +
            processedFailedFileNum
          deferred.notify(processedFileNum + 1 / filesInfo.length + 1)
          if (processedFileNum === filesInfo.length && !isReturned) {
            prepareReturnData()
            if (processedFailedFileNum === 0) {
              deferred.resolve(returnedFilesData)
            } else {
              deferred.reject('Failed to load and get file contents')
            }
            isReturned = true
          }
        }

        function loadFileResource (fileInfo, onSuccess, onFail) {
          var getFn
          var localizeFn
          if (fileInfo.fileType === FILE_TYPE.MODULE) {
            getFn = DBUtil.getContextModuleCodes
            localizeFn = DBUtil.localizeContextModuleCodes
          } else {
            getFn = DBUtil.getContextLibCodes
            localizeFn = DBUtil.localizeContextLibCodes
          }
          getFn.call(DBUtil, me.contextId, fileInfo.fullPath).then(
            function (fileContents) {
              if (fileContents.length > 0) {
                onSuccess(fileContents[0].content)
              } else {
                localizeFn.call(DBUtil,
                  me.contextId, fileInfo.fullPath, fileInfo.filePath
                ).then(
                  function (codes) {
                    onSuccess(codes)
                  },
                  function (error) {
                    onFail(error)
                  }
                )
              }
            },
            function (error) {
              onFail(error)
            }
          )
        }

        if (!_.isEmpty(filesInfo)) {
          filesInfo = _x.util.asArray(filesInfo)
          _.forEach(filesInfo,
            function (fileInfo, index) {
              var loadResourceFn
              logger.debug(
                'Load file content through the file fullPath:' + fileInfo.fullPath
              )
              loadedFilesContent[fileInfo.fullPath] = {
                order: index,
                loadedFileInfo: null
              }
              loadFileResource(
                fileInfo,
                _.partial(onFileLoadCompleted, fileInfo),
                _.partial(onFileLoadFail, fileInfo),
                _.partial(onFileLoadProgress, fileInfo)
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
              this._construct()
              this.moduleType = moduleType
            },
            function (parentCtx, moduleType) {
              this._construct(moduleType)
              this.parentContext = parentCtx
            }
          ],
          props: {
            ctxPackage: {
              _xConfig: true,
              type: XPackage
            },
            contextId: null,
            moduleType: null,
            parentContext: null,
            // Used for storing the modules loading status
            loadingModules: {},
            // used for storing loaded libs information
            loadedLibs: {}
          },
          staticMethods: {
            /**
             * @description
             * load library modules into module registry
             *
             * @memberOf XModuleContext#
             * @public
             * @static
             * @method
             * @param context
             * @param libFiles
             * @returns PromiseLike<ModuleContext>
             */
            loadContextLibs: function (context, libFiles) {
              return context.loadLibs(libFiles)
            },
            /**
             * @memberOf XModuleContext#
             * @public
             * @static
             * @method
             * @param context
             * @param moduleFiles
             * @returns PromiseLike<ModuleContext>
             */
            loadContextModules: function (context, moduleFiles) {
              return context.loadModules(moduleFiles)
            },
            /**
             * @memberOf XModuleContext#
             * @public
             * @static
             * @method
             * @returns {Object} - path in details
             */
            parseName: function (fullPath) {
              if (_.isString(fullPath) && !_.isEmpty(fullPath)) {
                var paths = _.split(fullPath, '.')
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
                throw Error('XModule path name "' + fullPath + '" is invalid')
              }
            }
          },
          methods: {
            setConfiguration: function (config) {
              _.assign(
                this.configuration,
                config,
                _.pick(
                  config, _.keys(this.configuration)
                )
              )
            },
            getConfigValue: function (keyPath) {
              return _.property(_.split(keyPath, '.'))(this.configuration)
            },
            init: function () {
              this.initContextId()
            },
            initContextId: function () {
              if (this.moduleType === MODULE_TYPE.BOOT_MODULE) {
                this.contextId = 'boot-context'
              } else if (this.moduleType === MODULE_TYPE.EXT_MODULE) {
                this.contextId = 'ext-context'
              } else {
                this.contextId = 'program-context-' + this.getContextIdSuffix()
              }
            },
            /**
             * Abstract method to be overwritten by sub class
             */
            // eslint-disable-next-line lodash/prefer-noop
            getContextIdSuffix: function () {},
            getContextPackage: function () {
              return this.ctxPackage
            },
            /**
             * @description
             * Load the module libs from the remote repository or local cache
             * into module context module registry
             *
             * @memberOf XModuleContext#
             * @public
             * @instance
             * @method
             * @param libsInfo {Object}
             * @example
             * {
             *   fullPath: "test.boot:1.0",
             *   repoURL: null
             * }
             * @returns {*|PromiseLike<T | never>|Promise<T | never>}
             */
            loadLibs: function (libsInfo) {
              var me = this
              var loadingLibs = []
              _.forEach(libsInfo,
                function (libInfo) {
                  // getting library loading info
                  var loadedLibInfo = me.loadedLibs[libInfo.fullPath]
                  if (!_.isEmpty(loadedLibInfo)) {
                    if (loadedLibInfo.status === LIB_LOADING_STATUS.COMPLETED) {
                      loadingLibs.push(Q(loadedLibInfo))
                    } else {
                      loadingLibs.push(loadedLibInfo.promise)
                    }
                  } else {
                    loadingLibs.push(processLoadingLib.call(me, libInfo))
                  }
                }
              )
              // return promise, and it will be resolved once all libraries are all loaded
              return Q.all(loadingLibs)
            },
            /**
             * @description
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
             * @description
             * Load modules from module or module lib file path
             * it returns promise for notifying the next step in the chain
             * when all modules have been fully loaded
             *
             * @memberOf XModuleContext#
             * @public
             * @instance
             * @method
             * @param mFilePaths modules file path
             * @param moduleType
             * @returns {PromiseLike<T | never>|Promise<T | never>}
             */
            loadModules:
              [
                function (mFilePaths) {
                  var me = this
                  // Used for storing the all modules information which can be promise or actual module instance
                  // this information will be returned as part of the pipeline
                  var loadingModules = []
                  _.forEach(mFilePaths,
                    function (modulePath) {
                      // getting module loading status
                      var moduleLoading = me.loadingModules[modulePath]
                      // try to get the module from the previously already loaded modules
                      var loadedModule = me.getModule(modulePath)
                      if (!_.isEmpty(loadedModule)) {
                        // if the module has been loaded before, then just put into
                        // loadingModules
                        loadingModules.push(Q(loadedModule))
                      } else if (
                        moduleLoading &&
                        (
                          moduleLoading.status === MODULE_LOADING_STATUS.LOADING_REMOTE_FILE ||
                          moduleLoading.status === MODULE_LOADING_STATUS.PARSING_MODULE_CONTENT ||
                          moduleLoading.status === MODULE_LOADING_STATUS.COMPLETED ||
                          moduleLoading.status === MODULE_LOADING_STATUS.FAILED
                        )
                      ) {
                        // if the requested modules which have been requested before
                        // then put the previous requested loading status promise into loadingModules
                        loadingModules.push(moduleLoading.promise)
                      } else {
                        // if the module was never requested before
                        // then need to generate loading status request record
                        // and put the generated loading status promise into loadingModules
                        loadingModules.push(
                          processLoadingModule.call(me, modulePath)
                        )
                      }
                    }
                  )
                  return Q.all(loadingModules)
                }
              ],
            register: [
              function (fullPath, moduleContent) {
                var pathInfo = XModuleContext.parseName(fullPath)
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
              var packagePaths = _.split(packagePath, '.')
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
              function (fullPath) {
                var info = XModuleContext.parseName(fullPath)
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
               * @param fullPath
               * @returns {XModule}
               */
              function (fullPath) {
                var info = XModuleContext.parseName(fullPath)
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
              function (fullPath) {
                var info = XModuleContext.parseName(fullPath)
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
        systemDefaultProgram.init()
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
              var bootLibs, extLibs, appLibs
              var bootContext, extContext

              bootContext = XModuleContext.newInstance(MODULE_TYPE.BOOT_MODULE)
              extContext = XModuleContext.newInstance(bootContext, MODULE_TYPE.EXT_MODULE)
              bootContext.init()
              extContext.init()
              me.$.bootContext = bootContext
              me.$.extContext = extContext

              return Q.when(loadDefaultConfiguration()).then(
                function () {
                  bootLibs = me.getConfigValue('bootLibs')
                  if (!_.isUndefined(bootLibs)) {
                    return XModuleContext.loadContextLibs(bootContext, bootLibs)
                  }
                }
              ).then(
                function () {
                  bootModules = me.getConfigValue('bootModules')
                  if (!_.isUndefined(bootModules)) {
                    return XModuleContext.loadContextModules(
                      bootContext, bootModules
                    )
                  }
                }
              ).then(
                function () {
                  extLibs = me.getConfigValue('extLibs')
                  if (!_.isUndefined(extLibs)) {
                    return XModuleContext.loadContextLibs(extContext, extLibs)
                  }
                }
              ).then(
                function () {
                  extModules = me.getConfigValue('extModules')
                  if (!_.isUndefined(extModules)) {
                    return XModuleContext.loadContextModules(
                      extContext, extModules
                    )
                  }
                }
              ).then(
                function () {
                  return startDefaultProgram.call(me)
                }
              ).catch(
                function (errors) {
                  console.error(
                    'Failed to initialize the root VM, caused by:' + errors)
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
              baseLibPath: null,
              entryClassName: null,
              programId: null
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
              return Q().then(
                function () {
                  if (!_.isEmpty(me.getConfigValue('appLibs'))) {
                    return me.loadLibs(
                      me.getConfigValue('appLibs')
                    )
                  }
                }
              ).then(
                function () {
                  return me.loadModules(
                    _x.util.asArray(me.configuration.entryClassName))
                }
              )
            },
            start: function () {
              return this.mProgramClass.main()
            },
            getContextIdSuffix: function () {
              return this.configuration.programId
            }
          }
        }
        , XModuleContext
      )

      root.createProgram = function () {
        return XProgram.createProgramInstance.call(arguments)
      }

      root.exportModule = XModule.exportModule
    }

    function initVM () {
      return Q.when(prepareCommon())
      .then(enableDB)
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
