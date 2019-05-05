/* eslint-disable no-caller */
(function () {
    var root = {}
    var gRoot = this
    var configuration = {}
    var metaExtractFunction
    var classMetaExtractionRule
    var ifMetaExtractionRule
    var RootType, XFace
    var commonUtil, methodUtil
    var exportedUtil = {}
    var dependencyChecker
    var dependencies = {
      'underscore': {
        checkFn: function () {
          return (typeof _ === 'function')
        }
      }
    }

    function init () {
      (function () {
        var initDependencyChecker = function () {
          dependencyChecker = {
            check: function (dependencies) {
              var errors = []
              _.each(dependencies, function (dependency, key) {
                if (typeof dependency.checkFn === 'function') {
                  var checkResult = dependency.checkFn.call()
                  if (!checkResult) {
                    errors.push('Dependency "' + key + '" is not available')
                  }
                  if (_.isFunction(dependency.postFn)) {
                    dependency.postFn()
                  }
                }
              }, this)
              return errors
            }
          }
        }
        initDependencyChecker()
        var checkResult = dependencyChecker.check(dependencies)
        if (checkResult.length !== 0) {
          throw Error('Dependency check failed because :\n' + checkResult.join('\n'))
        }
      })()
      var initUtil = function () {
        commonUtil = {}
        commonUtil.getRandomString = function (length) {
          var letters = 'abcdefghijklmnopqrstuvwxyz0123456789'
          var result = ''
          _(length).times(function () {
            result += letters.charAt(_.random(0, letters.length - 1))
          })
          return result
        }
        commonUtil.checkValueType = function (value, type) {
          var result = false
          if (
            // if the type is missing, then will be considered as matched
            (
              _.isUndefined(type) || type === 'any'
            ) ||
            // compare primitive string,number,boolean primitive type
            (
              (_.isString(type) && ['string', 'number', 'boolean'].indexOf(type) !== -1) &&
              (typeof value).toLowerCase() === type
            ) ||
            // compare primitive function type
            (
              type === 'function' &&
              _.isFunction(value) && !value.isCustomClass
            ) ||
            // compare primitive object
            (
              type === 'object' && (typeof value).toLowerCase() === 'object' &&
              !(value instanceof RootType)
            ) ||
            // compare class type
            (
              _.isFunction(type) && type.isCustomClass &&
              (value instanceof type)
            ) ||
            // compare interface type
            (
              _.isObject(type) && (type instanceof XFace) &&
              (value instanceof RootType) && value._supportInterfaceOf(type)
            )
          ) {
            result = true
          }
          return result
        }
        commonUtil.assignOwnProperty = function (dObj, sObj, pickFn) {
          _.extendOwn(
            dObj,
            _.mapObject(
              _.pick(
                sObj, _.keys(dObj)
              ),
              _.isFunction(pickFn) ? pickFn : function (val, key) {
                return val
              }
            )
          )
        }
        commonUtil.asArray = function (value) {
          return _.isArray(value) ? value : value.split(',')
        }
        methodUtil = {
          getInfoFromDeclaredFunction: function (func) {
            var funcInfo = {}
            if (_.isFunction(func)) {
              var params = []
              var sourceCode = func.toString().split('{')[0].trim()
              var pattern = /function\s*(\w*)\s*\(([\s|\S]*)\)/i
              var results = pattern.exec(sourceCode)
              var funcName = func.name || results[1]
              var paramString = !_.isNull(results) && results[2]
              if (paramString) {
                var parameters = paramString.split(',')
                _.each(parameters, function (parameter) {
                  params.push(
                    {
                      name: parameter.trim(),
                      type: 'any'
                    }
                  )
                }, this)
              }
              funcInfo.name = funcName
              funcInfo.params = params
              funcInfo.method = func
              return funcInfo
            } else {
              throw Error('unable to grab function information from invalid function')
            }
          },
          hasMethod: function (method, tempMethods) {
            _.some(tempMethods, function (tMethod) {
              return methodUtil.checkMethod(method, tMethod)
            })
          },
          checkMethod: function (fInfo, cInfo) {
            if (cInfo.name !== fInfo.name) return false
            if (cInfo.params.length !== fInfo.params.length) return false
            return _.every(
              fInfo.params,
              function (fParam, index) {
                return methodUtil.checkParam(fParam, cInfo.params[index])
              }
            )
          },
          checkParam: function (fParam, cParam) {
            if (fParam.type === cParam.type) {
              return true
            }
            return (
              (fParam.type.isCustomClass && cParam.type.isCustomClass) &&
              (cParam.type instanceof fParam.type)
            )
          }
        }
      }
      var initExportedUtil = function () {
        exportedUtil.dependencyChecker = dependencyChecker
        _.extendOwn(exportedUtil, commonUtil, methodUtil)
      }
      var initRoot = function () {
        if (_.isUndefined(gRoot._x)) {
          gRoot._x = root
        } else {
          _.extendOwn(gRoot._x, root)
        }
      }
      var initConfiguration = function () {
        root.configuration = configuration
      }
      var prepareExtractionFunction = function () {
        var vType = ['string', 'number', 'boolean', 'function', 'object', 'any']
        var hookBeforeProcessAllItems = 'beforeProcessAllItems'
        var hookProcessEachArrayElement = 'processEachArrayElement'
        var hookProcessEachObjectKeyElement = 'processEachObjectKeyElement'
        var hookBeforeProcessEachItem = 'beforeProcessEachItem'
        var returnType = function (value,
                                   propertyNameOfReturnedValue,
                                   eachSrcMetaInfo) {
          var type = _.isObject(eachSrcMetaInfo) ? eachSrcMetaInfo.type : undefined
          if (_.isEmpty(type)) {
            return 'any'
          } else if (
            (_.isString(type) && vType.indexOf(type) !== -1) ||
            (type.isCustomIf || type.isCustomClass)
          ) {
            return type
          } else {
            throw new Error('Parameter type "' + type + '" is not supported ')
          }
        }
        var returnName = function (srcNodeInfo) {
          if (_.isString(srcNodeInfo)) {
            return srcNodeInfo
          } else {
            throw new Error('missing node name information or it is not string type')
          }
        }
        var returnMethod = function (srcNodeInfo) {
          var returnFunction
          if (_.isFunction(srcNodeInfo)) {
            returnFunction = srcNodeInfo
          } else {
            throw Error('The definition of the method is invalid')
          }
          return returnFunction
        }

        var propertyRuleElements = {
          isMultiple: true,
          processEachObjectKeyElement: function (key, info) {
            var returnInfo
            if (_.isFunction(info)) {
              returnInfo = {
                name: key,
                value: undefined
              }
            } else if (
              _.isObject(info) && info.__xConfig
            ) {
              returnInfo = _.extendOwn(info, {
                name: (info && info.name) || key
              })
            } else {
              returnInfo = {
                name: (info && info.name) || key,
                value: info
              }
            }
            return returnInfo
          },
          processEachArrayElement: function (info) {
            if (info && info.defaultValue && _.isFunction(info.defaultValue)) {
              return undefined
            } else {
              return info
            }
          },
          beforeProcessEachItem: function (metaData) {
            var returnInfo
            if (_.isString(metaData)) {
              returnInfo = {
                name: metaData
              }
            } else {
              returnInfo = metaData
            }
            return returnInfo
          },
          childElements: {
            name: {
              returnValue: returnName
            },
            type: {
              returnValue: returnType
            },
            shared: {
              returnValue: function (value,
                                     propertyNameOfReturnedValue,
                                     eachSrcMetaInfo) {
                return (_.isObject(eachSrcMetaInfo) && eachSrcMetaInfo.shared)
              }
            },
            defaultValue: {
              returnValue: function (value) {
                if (_.isFunction(value)) {
                  return undefined
                } else {
                  return value
                }
              }
            }
          }
        }
        var processMethodInfoWithKey = function (info, key) {
          var methodInfo
          if (_.isFunction(info)) {
            methodInfo = methodUtil.getInfoFromDeclaredFunction(info)
            methodInfo.name = key
          } else if (_.isObject(info) && !_.isArray(info)) {
            methodInfo = _.extendOwn(
              info,
              {
                name: key
              }
            )
          } else {
            methodInfo = undefined
          }
          return methodInfo
        }
        var methodRuleElement = {
          name: {
            returnValue: returnName
          },
          params: {
            isMultiple: true,
            childElements: {
              type: {
                returnValue: returnType
              }
            }
          },
          method: {
            returnValue: returnMethod
          }
        }
        var methodRuleElements = {
          isMultiple: true,
          beforeProcessAllItems: function (metaData) {
            if (_.isObject(metaData) && !_.isArray(metaData)) {
              var methods = []
              _.each(metaData, function (eachMetaInfo, key) {
                if (_.isArray(eachMetaInfo)) {
                  _.each(eachMetaInfo, function (subInfo) {
                    methods.push(processMethodInfoWithKey(subInfo, key))
                  }, this)
                } else {
                  methods.push(processMethodInfoWithKey(eachMetaInfo, key))
                }
              }, this)
              return methods
            } else {
              return metaData
            }
          },
          processEachArrayElement: function (info) {
            var returnInfo
            if (_.isFunction(info)) {
              returnInfo = methodUtil.getInfoFromDeclaredFunction(info)
            } else {
              returnInfo = info
            }
            return returnInfo
          },
          childElements: methodRuleElement
        }

        ifMetaExtractionRule = (function () {
          return {
            isMultiple: false,
            childElements: {
              props: propertyRuleElements,
              methods: _.extendOwn(
                methodRuleElements,
                {
                  childElements: methodRuleElement
                }
              )
            }
          }
        })()
        classMetaExtractionRule = (function () {
          return {
            isMultiple: false,
            childElements: {
              implements: {
                isMultiple: true,
                returnValue: function (value) {
                  return value
                }
              },
              props: propertyRuleElements,
              staticProps: propertyRuleElements,
              methods: methodRuleElements,
              staticMethods: methodRuleElements,
              construct: _.extendOwn(
                _.clone(methodRuleElements),
                {
                  beforeProcessAllItems: function (metaData) {
                    if (_.isArray(metaData)) {
                      return metaData
                    } else {
                      return [metaData]
                    }
                  },
                  beforeProcessEachItem: function (metaData) {
                    metaData.name = 'construct'
                    return metaData
                  }
                }
              ),
              name: {
                returnValue: function (srcNodeInfo) {
                  if (_.isString(srcNodeInfo)) {
                    return srcNodeInfo
                  } else {
                    return undefined
                  }
                }
              }
            }
          }
        })()
        metaExtractFunction = function (srcMetaInfo, srcParentMetaInfo, extractionRule) {
          var extractionResult = {
            resultMetaInfo: undefined,
            resultParentInfo: undefined
          }

          function extractSrcMetaInfo (srcMetaInfo) {
            function extractNode (nodeRule, srcMetaForRule, propertyNameOfReturnedValue,
                                  parentSrcMetaForRule) {
              var nodeValue

              function processEachSrcMetaElement (eachSrcMetaInfo) {
                var eachCleanSrcMetaInfo = {}
                _.each(nodeRule.childElements, function (elementRule, elementName) {
                  if (hookCalls[hookBeforeProcessEachItem]) {
                    eachSrcMetaInfo = hookCalls[hookBeforeProcessEachItem](eachSrcMetaInfo)
                  }
                  eachCleanSrcMetaInfo[elementName] = extractNode(
                    elementRule,
                    !_.isUndefined(eachSrcMetaInfo[elementName])
                      ? eachSrcMetaInfo[elementName] : eachSrcMetaInfo.value,
                    elementName,
                    eachSrcMetaInfo
                  )
                }, this)
                return eachCleanSrcMetaInfo
              }

              var hooks = [
                hookBeforeProcessAllItems,
                hookBeforeProcessEachItem,
                hookProcessEachArrayElement,
                hookProcessEachObjectKeyElement
              ]
              var hookCalls = {}
              _.each(hooks, function (hook) {
                var hookFunc
                hookCalls[hook] =
                  ((hookFunc = nodeRule[hook]) && _.isFunction(hookFunc) && hookFunc
                  ) || undefined
              }, this)
              if (srcMetaForRule === undefined) {
                return undefined
              }
              if (hookCalls[hookBeforeProcessAllItems]) {
                srcMetaForRule = hookCalls[hookBeforeProcessAllItems](srcMetaForRule)
              }
              if (_.isFunction(nodeRule.returnValue)) {
                // while it is handling returning value
                if (nodeRule.isMultiple && _.isArray(srcMetaForRule)) {
                  nodeValue = _.map(srcMetaForRule, function (info) {
                    return nodeRule.returnValue(info)
                  })
                } else if (nodeRule.isMultiple && _.isObject(srcMetaForRule)) {
                  nodeValue = [nodeRule.returnValue(srcMetaForRule)]
                } else {
                  nodeValue = nodeRule.returnValue(
                    srcMetaForRule,
                    propertyNameOfReturnedValue,
                    parentSrcMetaForRule)
                }
              } else {
                if (!_.isObject(nodeRule.childElements)) {
                  throw [
                    'node rule for property "' + propertyNameOfReturnedValue,
                    '" is specified without return function ',
                    ', but it is missing childElements or it is not object type'
                  ].join('')
                }
                if (!_.isObject(srcMetaForRule)) {
                  throw [
                    'node rule for property "' + propertyNameOfReturnedValue,
                    '" is specified with "isMultiple=true"',
                    ', but declared corresponding information is not object type'
                  ].join('')
                }
                if (nodeRule.isMultiple) {
                  nodeValue = []
                  if (_.isArray(srcMetaForRule)) {
                    _.each(srcMetaForRule,
                      function (eachElementInfo) {
                        var elementInfo
                        var hookCall
                        if ((hookCall = hookCalls[hookProcessEachArrayElement])) {
                          elementInfo = hookCall.call(this, eachElementInfo)
                        } else {
                          elementInfo = eachElementInfo
                        }
                        if (!_.isUndefined(elementInfo)) {
                          nodeValue.push(
                            processEachSrcMetaElement(elementInfo)
                          )
                        }
                      },
                      this
                    )
                  } else {
                    _.each(srcMetaForRule, function (eachElementInfo, key) {
                      var elementInfo
                      var hookCall
                      if ((hookCall = hookCalls[hookProcessEachObjectKeyElement])) {
                        elementInfo = hookCall.call(this, key, eachElementInfo)
                      } else {
                        elementInfo = eachElementInfo
                      }
                      if (!_.isUndefined(elementInfo)) {
                        nodeValue.push(
                          processEachSrcMetaElement(elementInfo)
                        )
                      }
                    }, this)
                  }
                } else {
                  nodeValue = processEachSrcMetaElement(srcMetaForRule)
                }
              }
              return nodeValue
            }

            return extractNode(extractionRule, srcMetaInfo, 'class', undefined)
          }

          if (srcMetaInfo) {
            extractionResult.resultMetaInfo = extractSrcMetaInfo(srcMetaInfo)
          } else {
            extractionResult.resultMetaInfo = {}
          }
          return extractionResult
        }
      }
      var initRootType = function () {
        RootType = function () {}
      }
      var initXFace = function () {
        function getMethods (face) {
          var methods = []
          _.each(face.methods, function (method) {
            methods.push(method)
          })
          if (_.isArray(face.parentIfs)) {
            _.each(face.parentIfs, function (parentIf) {
              methods = _.union(methods, getMethods(parentIf))
            })
          }
          return methods
        }

        XFace = function (contractInfo, parentInfo) {
          this.methods = contractInfo.methods
          this.props = contractInfo.props
          this.parentIfs = parentInfo
          this.isCustomIf = true
        }
        XFace.prototype = Object.create(RootType)
        XFace.prototype.getValue = function (propName) {
          var searchResult = _.find(this.props, function (propInfo) {
            return propInfo.name === propName
          })
          if (searchResult) {
            return searchResult.defaultValue
          } else {
            throw new Error('Property "' + propName + '" value is not found')
          }
        }
        XFace.prototype.getMethods = function () {
          var methods = getMethods(this)
          var tempMethods = []
          return _.filter(
            methods,
            function (method) {
              if (methodUtil.hasMethod(method, tempMethods)) {
                return false
              } else {
                tempMethods.push(method)
                return true
              }
            }
          )
        }
      }
      initUtil()
      initExportedUtil()
      initRootType()
      initXFace()
      initRoot()
      initConfiguration()
      prepareExtractionFunction()
    }

    function setup () {
      var methodContainerType = {
        methodTypeInstance: 0,
        methodTypeStatic: 1,
        methodTypeConstruct: 2
      }
      var clsValidator = {
        checkIfs: function (classRef) {
          var faces = classRef._meta.implements
          var errors = []
          if (!_.isEmpty(faces)) {
            _.each(faces, function (faceRef) {
              var validationError = clsValidator._validateClassFaceImplementation(classRef, faceRef)
              if (!_.isEmpty(validationError)) {
                errors.push(validationError)
              }
            })
          }
          return errors
        },
        _validateClassFaceImplementation: function (classRef, faceRef) {
          var faceMethods = faceRef.getMethods()
          var classMethods = classRef._meta.classInfo.methods
          var errors = []
          _.every(
            faceMethods,
            function (faceMethodInfo) {
              if (!_.find(
                classMethods,
                function (classMethodInfo) {
                  return methodUtil.checkMethod(faceMethodInfo, classMethodInfo)
                }
              )) {
                errors.push(
                  'interface method: ' + faceMethodInfo.name + ' implementation is not found'
                )
                return false
              }
            }
          )
          return errors
        }
      }
      var clsPropertyUtil = {
        assignPropertyValue: function (propInfo, properties, nonSharedProperties) {
          if (_.isUndefined(propInfo.defaultValue)) {
            properties[propInfo.name] = undefined
          } else if (
            _.isObject(propInfo.defaultValue) && !propInfo.shared
          ) {
            properties[propInfo.name] = _.clone(propInfo.defaultValue)
            if (nonSharedProperties) {
              nonSharedProperties.push(propInfo)
            }
          } else {
            properties[propInfo.name] = propInfo.defaultValue
          }
        },
        assignProperties: function (classMeta, obj, allProperties, allNonSharedValueProperties) {
          var properties = {}
          var propertyTypeInfo = {}

          function getAllProperties () {
            addProperties(classMeta)
            return properties
          }

          function addProperties (eachClassMeta) {
            var metaInfo = eachClassMeta.classInfo
            var parentClass = eachClassMeta.parentClass
            if (parentClass && parentClass.isCustomClass && parentClass._meta) {
              addProperties(parentClass._meta)
            }
            _.each(metaInfo.props, function (propInfo) {
              propertyTypeInfo[propInfo.name] = propInfo.type
              clsPropertyUtil.assignPropertyValue(propInfo, properties, allNonSharedValueProperties)
            })
          }

          if (!allProperties) {
            // for reuse
            allProperties = getAllProperties()
          } else {
            properties = _.clone(allProperties)
            _.each(allNonSharedValueProperties, function (propInfo) {
              clsPropertyUtil.assignPropertyValue(propInfo, properties)
            })
          }
          _.each(properties, function (propertyValue, key) {
            var cachedPropertyValue
            var valueType = propertyTypeInfo[key]
            if (!_.has(obj, key)) {
              cachedPropertyValue = propertyValue
              Object.defineProperty(obj, key, {
                enumerable: true,
                configurable: false,
                get: function () {
                  return cachedPropertyValue
                },
                set: function (value) {
                  if (commonUtil.checkValueType(value, valueType)) {
                    cachedPropertyValue = value
                  } else {
                    var valueTypeOfValue = (typeof value).toLowerCase()
                    var exTypeName =
                      (_.isString(valueType) && valueType) ||
                      (_.isFunction(valueType) && valueType.isCustomClass && 'Class') ||
                      (_.isObject(valueType) && valueType.isCustomIf && 'Interface') ||
                      'unknown'
                    var acTypeName =
                      (_.contains(['string', 'number', 'boolean'], valueTypeOfValue) && valueTypeOfValue) ||
                      (valueTypeOfValue === 'object' && (value instanceof RootType) && 'Class') ||
                      (valueTypeOfValue === 'object' && !(value instanceof RootType) && 'object') ||
                      (valueTypeOfValue === 'function' && !(value.isCustomClass) && 'function') ||
                      (valueTypeOfValue === 'function' && value.isCustomClass && 'Class type') ||
                      'unknown'
                    if (
                      _.contains(['string', 'number', 'boolean', 'object'], exTypeName) &&
                      acTypeName !== exTypeName
                    ) {
                      throw Error(
                        'The type of value for property "' + key + '" is invalid because:\n' +
                        'the assigned value type is: "' + acTypeName + '" but the expected type is "' + exTypeName + '"'
                      )
                    } else if (exTypeName === 'Interface') {
                      if (acTypeName === 'Class') {
                        throw Error(
                          'The type of value for property "' + key + '" is invalid because:\n' +
                          'the assigned class instance does not implement the expected interface type'
                        )
                      } else {
                        throw Error(
                          'The type of value for property "' + key + '" is invalid because:\n' +
                          'the assigned value type is:"' + acTypeName + '" but the expected type is "' + exTypeName + '"'
                        )
                      }
                    } else if (exTypeName === 'Class') {
                      if (acTypeName === 'Class') {
                        throw Error(
                          'The type of value for property "' + key + '" is invalid because:\n' +
                          'the assigned class instance is not the expected type of Class'
                        )
                      } else {
                        throw Error(
                          'The type of value for property "' + key + '" is invalid because:\n' +
                          'the assigned value type is:"' + acTypeName + '" but the expected type is "' + exTypeName + '"'
                        )
                      }
                    } else {
                      throw Error(
                        'The type of value for property "' + key + '" is invalid because of unknown issue'
                      )
                    }
                  }
                }
              })
            }
          }, this)
        }
      }
      var clsMethodUtil = {
        getMethodFromMap: function (methodName, params, methodType, map) {
          var mapType = methodType || methodContainerType.methodTypeInstance
          var methodNameIndex = map[mapType][methodName]
          var findResult
          var result = {
            isFound: false,
            errors: '',
            method: null
          }
          if (!methodNameIndex) {
            return result
          }
          findResult = clsMethodUtil.findMethodByComparingParameter(params, map[mapType][methodName])
          if (!findResult.errors) {
            result.method = findResult.method
            result.isFound = true
          } else {
            result.errors = 'method "' + methodName + '" is not found because ' + findResult.errors
          }
          return result
        },
        makeMethodMap: function (methodsInfo) {
          var map = {}
          _.each(methodsInfo, function (methodInfo) {
            var methodNameIndex
            // assign empty object if the method name property is not assigned yet
            // the key will be property length
            if (!(methodNameIndex = map[methodInfo.name])) {
              methodNameIndex = {}
              map[methodInfo.name] = methodNameIndex
            }
            if (
              _.isArray(methodInfo.params) && methodInfo.params.length > 0
            ) {
              var methodParamLengthIndex
              // create param index if the method has the params
              if (!(methodParamLengthIndex = methodNameIndex[methodInfo.params.length])) {
                methodParamLengthIndex = []
                methodNameIndex[methodInfo.params.length] = methodParamLengthIndex
              }
              methodParamLengthIndex.push({
                params: methodInfo.params,
                method: methodInfo.method
              })
            } else {
              methodNameIndex[0] = methodInfo.method
            }
          }, this)
          return map
        },
        findMethodFromParentClass: function (pClass, methodName, methodType, args) {
          var result = {
            isFound: false,
            method: null,
            errors: ''
          }
          var searchResult = clsMethodUtil.getMethodFromMap(
            methodName,
            args,
            methodType,
            pClass._meta.methodMap
          )
          if (searchResult.isFound) {
            result.method = searchResult.method
            result.isFound = true
          } else {
            if (pClass._meta.parentClass) {
              return clsMethodUtil.findMethodFromParentClass(
                pClass._meta.parentClass,
                methodName, methodType, args
              )
            }
          }
          return result
        },
        findMethodByComparingParameter: function (rawParams, declaredMethods) {
          var result = {
            errors: '',
            method: undefined
          }
          // used to skip search if the method has been found
          var isMethodFound
          var paramMethods = declaredMethods[rawParams.length]

          if (_.isFunction(paramMethods)) {
            result.method = paramMethods
          } else if (_.isArray(paramMethods)) {
            _.each(paramMethods, function (paramMethod) {
              var paramsInfo = paramMethod.params
              // used for determining the fully match  after checking every parameter
              var isMatched
              // used for the judgement of stop continuing check on the rest parameter
              // if the one of them is not matched already
              var continueCheck = true
              // if the method is already found in the previous iteration check
              // then will exit the current function
              if (isMethodFound) {
                return
              }
              _.each(paramsInfo, function (paramInfo, paramIndex) {
                var rawParam = rawParams[paramIndex]
                if (!continueCheck) {
                  return
                }
                if (commonUtil.checkValueType(rawParam, paramInfo.type)) {
                  isMatched = true
                } else {
                  isMatched = false
                  continueCheck = false
                  result.errors = 'the parameter at the position #' + (paramIndex + 1) +
                    ' is not matched with expected parameter type'
                }
              }, this)
              if (isMatched) {
                result.method = paramMethod.method
                isMethodFound = true
              }
            })
          } else {
            result.errors = 'it is unexpected that no related params method information available'
          }
          return result
        },
        recordLastMethodCall: function (name, args, methodFn, context) {
          context.__runtime.lastMethodCallInfo = {
            methodName: name,
            args: args,
            method: methodFn
          }
        }
      }
      root.validateCls = function (classRef) {
        var checkErrors = clsValidator.checkIfs(classRef)
        if (_.isEmpty(checkErrors)) {
          return ''
        } else {
          return 'declared class does not implement required methods in declared interface, caused by : \n' + checkErrors
        }
      }
      root.createIf = function (metaInfo, pIfs) {
        var extractionResult, parentIfs, builtIf

        function build (cleanMetaInfo, parentInterface) {
          return new XFace(cleanMetaInfo, parentInterface)
        }

        function extractParentIfInfo (srcParentMetaInfo) {
          var ifs = []
          if (_.isUndefined(srcParentMetaInfo)) {
            return ifs
          }
          if (!_.isArray(srcParentMetaInfo)) {
            ifs.push(srcParentMetaInfo)
          } else {
            ifs = srcParentMetaInfo
          }
          if (!_.every(ifs,
            function (face) {
              return (_.isObject(face) && face.isCustomIf)
            }
          )) {
            throw Error('parent interface is not invalid')
          }
          return ifs
        }

        parentIfs = extractParentIfInfo(pIfs)
        extractionResult = metaExtractFunction(metaInfo, parentIfs, ifMetaExtractionRule)
        builtIf = build(extractionResult.resultMetaInfo, parentIfs)
        return builtIf
      }
      root.createCls = function (metaInfo, parentClass) {
        var extractionResult, parentClassInfo, builtCls

        function build (cleanMetaInfo, parentClass) {
          var XClass
          var methodMap
          var allProperties
          var allNonSharedValueProperties = []

          XClass = function () {
            var searchResult = clsMethodUtil.getMethodFromMap(
              'construct',
              arguments,
              methodContainerType.methodTypeConstruct,
              methodMap
            )
            clsPropertyUtil.assignProperties(
              XClass._meta, this, allProperties, allNonSharedValueProperties
            )
            this.$ = XClass._statics
            this.__runtime = {}
            if (searchResult.isFound) {
              clsMethodUtil.recordLastMethodCall('construct', arguments, searchResult.method, this)
              searchResult.method.apply(this, arguments)
            }
          }
          methodMap = {}
          _.each(methodContainerType, function (value) {
            methodMap[value] = {}
          }, this)

          // populate constructor methods
          methodMap[methodContainerType.methodTypeConstruct] = clsMethodUtil.makeMethodMap(cleanMetaInfo.construct)

          // populate static properties
          var metaStaticPropsInfo = cleanMetaInfo.staticProps
          XClass._statics = {}
          XClass.getStaticValue = function (propertyName) {
            if (_.has(this._statics, propertyName)) {
              return this._statics[propertyName]
            } else {
              throw Error('Property name is not found')
            }
          }
          XClass.setStaticValue = function (propertyName, value) {
            if (_.has(this._statics, propertyName)) {
              this._statics[propertyName] = value
            } else {
              throw Error('Property name is not found')
            }
          }
          _.each(metaStaticPropsInfo, function (propInfo) {
            XClass._statics[propInfo.name] = _.isArray(propInfo.defaultValue)
              ? _.clone(propInfo.defaultValue) : propInfo.defaultValue
          })
          XClass.$ = XClass._statics

          // populate static methods
          var metaStaticMethodsInfo = cleanMetaInfo.staticMethods
          methodMap[methodContainerType.methodTypeStatic] = clsMethodUtil.makeMethodMap(metaStaticMethodsInfo)
          _.each(metaStaticMethodsInfo, function (methodInfo) {
            XClass[methodInfo.name] = (function (pMethodInfo) {
              return function () {
                var searchResult = clsMethodUtil.getMethodFromMap(
                  pMethodInfo.name,
                  arguments,
                  methodContainerType.methodTypeStatic,
                  methodMap
                )
                if (searchResult.isFound) {
                  return searchResult.method.apply(this, arguments)
                } else {
                  throw Error(searchResult.errors)
                }
              }
            })(methodInfo)
          })

          // Define inheritance
          if (!_.isEmpty(parentClass)) {
            if (parentClass !== Error) {
              XClass.prototype = Object.create(parentClass.prototype)
            } else {
              XClass.prototype = Object.create(Error.prototype)
            }
          } else {
            XClass.prototype = Object.create(RootType.prototype)
          }

          XClass.prototype._callParent = function () {
            var methodName
            if (_.isEmpty(parentClass)) {
              return undefined
            }
            var lastMethodCallInfo = this.__runtime.lastMethodCallInfo
            var caller = arguments.callee.caller.caller
            var args = arguments
            if (arguments.length > 0 && typeof arguments[0].callee === 'function') {
              args = arguments[0]
            }
            if (caller.isCustomClass) {
              methodName = 'construct'
            } else {
              methodName = caller._methodName
            }
            if (!_.isEmpty(methodName)) {
              if (
                methodName === 'construct' &&
                lastMethodCallInfo.method !== arguments.callee.caller
              ) {
                throw Error('callParent method must be called at the beginning')
              }
              var methodType = methodName === 'construct' ? methodContainerType.methodTypeConstruct : methodContainerType.methodTypeInstance
              var result = clsMethodUtil.findMethodFromParentClass(
                parentClass,
                methodName,
                methodType,
                args
              )
              if (result.isFound) {
                return result.method.apply(this, args)
              } else if (!_.isEmpty(result.errors)) {
                throw Error(result.errors)
              } else {
                // do nothing
              }
            } else {
              throw Error('Unexpected method call context')
            }
          }

          // populate instance methods
          var metaMethodsInfo = cleanMetaInfo.methods
          methodMap[methodContainerType.methodTypeInstance] = clsMethodUtil.makeMethodMap(metaMethodsInfo)
          _.each(metaMethodsInfo, function (methodInfo) {
            XClass.prototype[methodInfo.name] = (function (pMethodInfo) {
              var fn = function () {
                var searchResult = clsMethodUtil.getMethodFromMap(
                  pMethodInfo.name,
                  arguments,
                  methodContainerType.methodTypeInstance,
                  methodMap
                )
                if (searchResult.isFound) {
                  clsMethodUtil.recordLastMethodCall(pMethodInfo.name, arguments, searchResult.method, this)
                  return searchResult.method.apply(this, arguments)
                } else {
                  throw Error(searchResult.errors)
                }
              }
              fn._methodName = methodInfo.name
              return fn
            })(methodInfo)
          })

          // adding meta property to the class
          XClass._meta = {
            classInfo: cleanMetaInfo,
            methodMap: methodMap,
            implements: (_.isEmpty(cleanMetaInfo.implements) ? [] : cleanMetaInfo.implements),
            parentClass: parentClass
          }
          cleanMetaInfo.implements = undefined
          XClass.isCustomClass = true

          // add newInstance method
          XClass.newInstance = function () {
            var instance = Object.create(XClass.prototype)
            XClass.apply(instance, arguments)
            return instance
          }

          // add tools set
          XClass.prototype._getClassType = function () {
            return XClass
          }
          XClass.prototype.$ = function () {
            return XClass.prototype._getClassType().$.apply(this, arguments)
          }
          XClass.prototype._supportInterfaceOf = function (face) {
            function hasIf (cls) {
              if (!_.isEmpty(cls._meta.implements)) {
                if (_.contains(cls._meta.implements, face)) {
                  return true
                } else {
                  if (!_.isEmpty(cls._meta.parentClass)) {
                    return hasIf(cls._meta.parentClass)
                  } else {
                    return false
                  }
                }
              }
            }

            if (face instanceof XFace) {
              return hasIf(XClass)
            } else {
              throw Error('Passed interface is not valid interface')
            }
          }

          return XClass
        }

        function extractParentClassInfo (srcParentMetaInfo) {
          if (srcParentMetaInfo) {
            if (_.isFunction(srcParentMetaInfo) &&
              srcParentMetaInfo.isCustomClass
            ) {
              return srcParentMetaInfo
            } else {
              throw new Error('parent class is not recognized supported class')
            }
          } else if (srcParentMetaInfo === null) {
            throw new Error('parent class can not be null')
          } else {
            return undefined
          }
        }

        parentClassInfo = extractParentClassInfo(parentClass)
        extractionResult = metaExtractFunction(metaInfo, parentClass, classMetaExtractionRule)
        builtCls = build(extractionResult.resultMetaInfo, parentClassInfo)

        var result = root.validateCls(builtCls)

        if (_.isEmpty(result)) {
          return builtCls
        } else {
          throw Error(result)
        }
      }

      root.isCustomClass = function (cls) {
        if (cls && cls.isCustomClass) {
          return true
        }
        return false
      }

      root.isCustomIf = function (customIf) {
        if (customIf && customIf.isCustomIf) {
          return true
        }
        return false
      }

      root.util = (function () {
        return exportedUtil
      })()
    }

    function prepareReturn () {
      root.noConflict = function () {
        throw new Error('xwebjs only works when _x is used as a global')
      }
      root.isLangCore = true
      if (typeof define === 'function' && define.amd) {
        define('_x', [], function () {
          return root
        })
      } else {
        return root
      }
    }

    init()
    setup()
    return prepareReturn()
  }.call(this)
)
