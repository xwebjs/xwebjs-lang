/* eslint-disable no-caller */
(
  function () {
    var root = {}
    var gRoot = this
    var configuration = {}
    var metaExtractFunction
    var classMetaExtractionRule, ifMetaExtractionRule, structureExtractionRule
    var XObject, XFace, XStructure, XAnnotation
    var commonUtil, methodUtil, annotationUtil, logger
    var withAnnotationCapabilities
    var exportedUtil = {}
    var dependencyChecker
    var runningModel
    var __runtime
    var vType = [
      'string', 'number', 'boolean',
      'object', 'class',
      'function', 'structure', 'array',
      'any'
    ]
    var RUNNING_MODE = {
      DEBUG: 'DEBUG',
      PROD: 'PROD',
      DEV: 'DEV'
    }

    // eslint-disable-next-line lodash/prefer-lodash-typecheck
    if (typeof _ !== 'function') {
      throw new Error('Missing mandatory dependent library')
    }

    var dependencies = {}

    function init () {
      var checkDependency = function () {
        var initDependencyChecker = function () {
          dependencyChecker = {
            check: function (dependencies) {
              var errors = []
              _.forEach(dependencies, function (dependency, key) {
                if (_.isFunction(dependency.checkFn)) {
                  var checkResult = dependency.checkFn.call()
                  if (!checkResult) {
                    errors.push('Dependency "' + key + '" is not available')
                  }
                  if (_.isFunction(dependency.postFn)) {
                    dependency.postFn()
                  }
                }
              })
              return errors
            }
          }
        }
        initDependencyChecker()
        var checkResult = dependencyChecker.check(dependencies)
        if (checkResult.length !== 0) {
          throw Error(
            'Dependency check failed because :\n' + checkResult.join('\n'))
        }
      }
      var prepareRuntimeManager = function () {
        __runtime = {
          callTrace: [],
          addCall: function (callInfo) {
            __runtime.callTrace.push(callInfo)
          },
          clearTrace: function () {
            this.callTrace = []
          },
          isPROD: function () {
            return runningModel === RUNNING_MODE.PROD
          },
          isDEV: function () {
            return runningModel === RUNNING_MODE.DEV
          },
          isDEBUG: function () {
            return runningModel === RUNNING_MODE.DEBUG
          }
        }
      }
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
        commonUtil.generateUUID = function () {
          var u = ''
          var i = 0
          while (i++ < 36) {
            var c = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'[i - 1]
            var r = Math.random() * 16 | 0
            var v = c === 'x' ? r : (r & 0x3 | 0x8)
            u += (c === '-' || c === '4') ? c : v.toString(16)
          }
          return u
        }
        commonUtil.getValueType = function (value) {
          var type = _.lowerCase(typeof value)
          if (_.includes(['string', 'number', 'boolean'], type)) {
            return type
          }
          if (type === 'function') {
            if (value.isCustomClass) {
              type = 'class'
            } else {
              type = 'function'
            }
          } else if (type === 'object') {
            if (value instanceof XObject) {
              type = value.self()
            } else if (value instanceof XFace) {
              type = value
            } else if (_.isNull(value)) {
              type = 'any'
            } else {
              type = 'object'
            }
          }
          return type
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
              (_.isString(type) && _.includes(['string', 'number', 'boolean'], type)) &&
              _.lowerCase(typeof value) === type
            ) ||
            // compare primitive function type
            (
              type === 'function' &&
              _.isFunction(value) && !value.isCustomClass
            ) ||
            // compare primitive object
            (
              type === 'object' && _.lowerCase(typeof value) === 'object' &&
              !(value instanceof XObject)
            ) ||
            // compare class type
            (
              _.isFunction(type) && type.isCustomClass &&
              (value instanceof type)
            ) ||
            // compare interface type
            (
              _.isObject(type) && (type instanceof XFace) &&
              (value instanceof XObject) && value._supportInterfaceOf(type)
            )
          ) {
            result = true
          }
          return result
        }
        commonUtil.asArray = function (value) {
          return _.isArray(value) ? value : _.split(value, ',')
        }
        annotationUtil = {}
        annotationUtil.annotationPresentCheckFn = function (
          annotation, metaInfo) {
          return _.find(
            metaInfo.annotations,
            function (annotationInstance) {
              return annotationInstance instanceof annotation
            }
          )
        }
        methodUtil = {
          getInfoFromDeclaredFunction: function (func) {
            var funcInfo = {}
            if (_.isFunction(func)) {
              var params = []
              var sourceCode = _.trim(_.split(func.toString(), '{')[0])
              var pattern = /function\s*(\w*)\s*\(([\s|\S]*)\)/i
              var results = pattern.exec(sourceCode)
              var funcName = _.trim(func.name) || results[1]
              var paramString = !_.isNull(results) && results[2]
              if (paramString) {
                var parameters = _.split(paramString, ',')
                params = _.map(parameters, function (parameter) {
                  return {
                    name: _.trim(parameter),
                    type: 'any'
                  }
                })
              }
              funcInfo.name = _.trim(funcName)
              funcInfo.params = params
              funcInfo.method = func
              return funcInfo
            } else {
              throw Error(
                'unable to grab function information from invalid function')
            }
          },
          hasMethod: function (method, tempMethods) {
            return _.some(tempMethods, function (tMethod) {
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
      var prepareLogger = function () {
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
      }
      var initExportedUtil = function () {
        exportedUtil.dependencyChecker = dependencyChecker
        _.assign(exportedUtil, commonUtil, methodUtil,
          { logger: logger }
        )
      }
      var initRoot = function () {
        if (_.isUndefined(gRoot._x)) {
          gRoot._x = root
        } else {
          _.assign(gRoot._x, root)
        }
      }
      var initConfiguration = function () {
        root.configuration = configuration
        runningModel = RUNNING_MODE.DEV
      }
      var prepareExtractionFunction = function () {
        var hookBeforeProcessAllItems = 'beforeProcessAllItems'
        var hookProcessEachArrayElement = 'processEachArrayElement'
        var hookProcessEachObjectKeyElement = 'processEachObjectKeyElement'
        var hookBeforeProcessEachItem = 'beforeProcessEachItem'
        var getValueTypeBasedOnDefaultValue = function (
          value,
          propertyNameOfReturnedValue,
          eachSrcMetaInfo) {
          if (
            _.isUndefined(eachSrcMetaInfo.type) &&
            !_.isUndefined(eachSrcMetaInfo.value) &&
            !_.isUndefined(value)
          ) {
            return commonUtil.getValueType(value)
          } else {
            return undefined
          }
        }
        var returnType = function (
          value,
          propertyNameOfReturnedValue,
          eachSrcMetaInfo) {
          var type
          type = getValueTypeBasedOnDefaultValue(
            value, propertyNameOfReturnedValue, eachSrcMetaInfo
          )
          if (!_.isUndefined(type)) {
            return type
          }
          type = _.isObject(eachSrcMetaInfo)
            ? eachSrcMetaInfo.type || 'any'
            : undefined
          if (_.isEmpty(type)) {
            return 'any'
          } else if (
            (_.isString(type) && _.includes(vType, type)) ||
            (type.isCustomIf || type.isCustomClass)
          ) {
            return type
          } else {
            throw new Error('Parameter type "' + type + '" is not supported ')
          }
        }
        var returnName = function (value) {
          if (_.isString(value)) {
            return value
          } else {
            throw new Error(
              'missing node name information or it is not string type')
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
        var returnDefaultValue = function (
          value
        ) {
          if (_.isFunction(value)) {
            return undefined
          } else {
            return value
          }
        }

        var annotationPropertiesRule = {
          annotations: {
            isMultiple: true,
            returnValue: function (value) {
              return value
            }
          }
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
              _.isObject(info) && info._xConfig
            ) {
              returnInfo = _.assign(info, {
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
          childElements: _.assign({
            name: {
              returnValue: returnName
            },
            type: {
              returnValue: returnType
            },
            shared: {
              returnValue: function (
                value,
                propertyNameOfReturnedValue,
                eachSrcMetaInfo) {
                return (_.isObject(eachSrcMetaInfo) && eachSrcMetaInfo.shared)
              }
            },
            defaultValue: {
              returnValue: returnDefaultValue
            }
          }, annotationPropertiesRule)
        }
        var processMethodInfoWithKey = function (info, key) {
          var methodInfo
          if (_.isFunction(info)) {
            methodInfo = methodUtil.getInfoFromDeclaredFunction(info)
            methodInfo.name = key
          } else if (_.isObject(info) && !_.isArray(info)) {
            methodInfo = _.assign(
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
        var methodRuleElement = _.assign(
          {
            name: {
              returnValue: returnName
            },
            params: {
              isMultiple: true,
              childElements: _.assign({
                  type: {
                    returnValue: returnType
                  }
                }, annotationPropertiesRule
              )
            },
            method: {
              returnValue: returnMethod
            }
          }, annotationPropertiesRule
        )
        var methodRuleElements = {
          isMultiple: true,
          beforeProcessAllItems: function (metaData) {
            var methods = []
            if (_.isObject(metaData) && !_.isArray(metaData)) {
              _.forEach(metaData, function (eachMetaInfo, key) {
                if (_.isArray(eachMetaInfo)) {
                  methods = _.union(methods, _.map(eachMetaInfo, function (subInfo) {
                      return processMethodInfoWithKey(subInfo, key)
                    })
                  )
                } else {
                  methods.push(processMethodInfoWithKey(eachMetaInfo, key))
                }
              })
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
              methods: _.assign(
                methodRuleElements,
                {
                  childElements: methodRuleElement
                }
              )
            }
          }
        })()
        classMetaExtractionRule = (function () {
          return _.assign(
            {
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
                construct: _.assign(
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
            },
            annotationPropertiesRule
          )
        })()
        structureExtractionRule = {
          isMultiple: false,
          childElements: {
            mixins: {
              isMultiple: true,
              returnValue: function (value) {
                if (!_.isUndefined(value) && value.isAnnotation) {
                  return value
                } else {
                  throw new Error('The mixed-in annotations assignment must be annotation')
                }
              }
            },
            props: {
              isMultiple: true,
              processEachObjectKeyElement: propertyRuleElements.processEachObjectKeyElement,
              childElements: {
                name: {
                  returnValue: returnName
                },
                defaultValue: {
                  returnValue: returnDefaultValue
                },
                type: {
                  returnValue: function (
                    value,
                    propertyNameOfReturnedValue,
                    eachSrcMetaInfo) {
                    var type
                    type = getValueTypeBasedOnDefaultValue(
                      value, propertyNameOfReturnedValue, eachSrcMetaInfo
                    )
                    if (!_.isUndefined(type)) {
                      return type
                    }
                    type = _.isObject(eachSrcMetaInfo)
                      ? eachSrcMetaInfo.type || 'string'
                      : undefined
                    if (
                      _.includes(['string', 'number', 'boolean'], type)
                    ) {
                      return type
                    } else {
                      throw new Error('The type of annotation property value assignment is invalid : ' + type)
                    }
                  }
                }
              }
            }
          }
        }

        metaExtractFunction = function (
          srcMetaInfo, srcParentMetaInfo, extractionRule) {
          var extractionResult = {
            resultMetaInfo: undefined,
            resultParentInfo: undefined
          }

          function extractSrcMetaInfo (srcMetaInfo) {
            function extractNode (nodeRule, srcMetaForRule,
                                  propertyNameOfReturnedValue,
                                  parentSrcMetaForRule) {
              var nodeValue

              function processEachSrcMetaElement (eachSrcMetaInfo) {
                var eachCleanSrcMetaInfo = {}
                _.forEach(nodeRule.childElements,
                  function (elementRule, elementName) {
                    if (hookCalls[hookBeforeProcessEachItem]) {
                      eachSrcMetaInfo = hookCalls[hookBeforeProcessEachItem](
                        eachSrcMetaInfo)
                    }
                    eachCleanSrcMetaInfo[elementName] = extractNode(
                      elementRule,
                      !_.isUndefined(eachSrcMetaInfo[elementName])
                        ? eachSrcMetaInfo[elementName] : eachSrcMetaInfo.value,
                      elementName,
                      eachSrcMetaInfo
                    )
                  })
                return eachCleanSrcMetaInfo
              }

              var hooks = [
                hookBeforeProcessAllItems,
                hookBeforeProcessEachItem,
                hookProcessEachArrayElement,
                hookProcessEachObjectKeyElement
              ]
              var hookCalls = {}
              _.forEach(hooks, function (hook) {
                var hookFunc
                hookCalls[hook] =
                  ((hookFunc = nodeRule[hook]) && _.isFunction(hookFunc) &&
                    hookFunc
                  ) || undefined
              })
              if (srcMetaForRule === undefined) {
                return undefined
              }
              if (hookCalls[hookBeforeProcessAllItems]) {
                srcMetaForRule = hookCalls[hookBeforeProcessAllItems](
                  srcMetaForRule)
              }
              if (_.isFunction(nodeRule.returnValue)) {
                // while it is handling returning value
                if (nodeRule.isMultiple && _.isArray(srcMetaForRule)) {
                  nodeValue = _.map(
                    srcMetaForRule, function (info) {
                      return nodeRule.returnValue(info)
                    }
                  )
                } else if (nodeRule.isMultiple && _.isObject(srcMetaForRule)) {
                  nodeValue = [nodeRule.returnValue(srcMetaForRule)]
                } else {
                  nodeValue = nodeRule.returnValue(
                    srcMetaForRule,
                    propertyNameOfReturnedValue,
                    parentSrcMetaForRule
                  )
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
                    _.forEach(srcMetaForRule,
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
                      }.bind(this)
                    )
                  } else {
                    _.forEach(srcMetaForRule, function (eachElementInfo, key) {
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
                      }.bind(this)
                    )
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
      var initXObject = function () {
        // eslint-disable-next-line lodash/prefer-noop
        XObject = function () {}
      }
      var initXStructure = function () {
        // eslint-disable-next-line lodash/prefer-noop
        XStructure = function () {}
      }
      var initXAnnotation = function () {
        // eslint-disable-next-line lodash/prefer-noop
        XAnnotation = function () {}
      }
      var initXFace = function () {
        function getMethods (face) {
          var methods = []
          methods = _.map(face.methods)
          if (_.isArray(face.parentIfs)) {
            _.forEach(face.parentIfs, function (parentIf) {
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
        XFace.prototype = _.create(XObject)
        XFace.prototype.getValue = function (propName) {
          var searchResult = _.find(this.props, ['name', propName])
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

      checkDependency()
      prepareLogger()
      prepareRuntimeManager()

      initRoot()
      initUtil()
      initExportedUtil()

      initXObject()
      initXFace()
      initXStructure()
      initXAnnotation()

      initConfiguration()
      prepareExtractionFunction()
    }

    function setup () {
      var MethodType = {
        INSTANCE: 0,
        STATIC: 1,
        CONSTRUCT: 2
      }
      var clsValidator = {
        validate: function (classRef) {
          var checkErrors = clsValidator._checkIfs(classRef)
          if (_.isEmpty(checkErrors)) {
            return ''
          } else {
            return 'declared class does not implement required methods in declared interface, caused by : \n' +
              checkErrors
          }
        },
        _checkIfs: function (classRef) {
          var faces = classRef.class.implements
          var errors = []
          if (!_.isEmpty(faces)) {
            _.forEach(faces, function (faceRef) {
              var validationError = clsValidator._validateClassFaceImplementation(
                classRef, faceRef)
              if (!_.isEmpty(validationError)) {
                errors.push(validationError)
              }
            })
          }
          return errors
        },
        _validateClassFaceImplementation: function (classRef, faceRef) {
          var faceMethods = faceRef.getMethods()
          var classMethods = classRef.class.classInfo.methods
          var errors = []
          _.forEach(
            faceMethods,
            function (faceMethodInfo) {
              if (!_.find(
                classMethods,
                function (classMethodInfo) {
                  return methodUtil.checkMethod(faceMethodInfo, classMethodInfo)
                }
              )) {
                errors.push(
                  'interface method: ' + faceMethodInfo.name +
                  ' implementation is not found'
                )
                return false
              }
            }
          )
          return errors
        }
      }
      var clsPropertyUtil = {
        assignPropertyValue: function (
          propInfo, properties, nonSharedProperties) {
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
        assignProperties: function (
          classMeta, obj, allProperties, allNonSharedValueProperties) {
          var properties = {}
          var propertyTypeInfo = {}

          function getAllProperties () {
            addProperties(classMeta)
            return properties
          }

          function addProperties (eachClassMeta) {
            var metaInfo = eachClassMeta.classInfo
            var parentClass = eachClassMeta.parentClass
            if (parentClass && parentClass.isCustomClass && parentClass.class) {
              addProperties(parentClass.class)
            }
            _.forEach(metaInfo.props, function (propInfo) {
              propertyTypeInfo[propInfo.name] = propInfo.type
              clsPropertyUtil.assignPropertyValue(propInfo, properties,
                allNonSharedValueProperties)
            })
          }

          if (!allProperties) {
            // for reuse
            allProperties = getAllProperties()
          } else {
            properties = _.clone(allProperties)
            _.forEach(allNonSharedValueProperties, function (propInfo) {
              clsPropertyUtil.assignPropertyValue(propInfo, properties)
            })
          }
          _.forEach(properties, function (propertyValue, key) {
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
                    var valueTypeOfValue = _.lowerCase(typeof value)
                    var exTypeName =
                      (_.isString(valueType) && valueType) ||
                      (_.isFunction(valueType) && valueType.isCustomClass &&
                        'Class') ||
                      (_.isObject(valueType) && valueType.isCustomIf &&
                        'Interface') ||
                      'unknown'
                    var acTypeName =
                      (_.includes(['string', 'number', 'boolean'],
                        valueTypeOfValue) && valueTypeOfValue) ||
                      (valueTypeOfValue === 'object' &&
                        (value instanceof XObject) && 'Class') ||
                      (valueTypeOfValue === 'object' &&
                        !(value instanceof XObject) && 'object') ||
                      (valueTypeOfValue === 'function' &&
                        !(value.isCustomClass) && 'function') ||
                      (valueTypeOfValue === 'function' && value.isCustomClass &&
                        'Class type') ||
                      'unknown'
                    if (
                      _.includes(['string', 'number', 'boolean', 'object'],
                        exTypeName) &&
                      acTypeName !== exTypeName
                    ) {
                      throw Error(
                        'The type of value for property "' + key +
                        '" is invalid because:\n' +
                        'the assigned value type is: "' + acTypeName +
                        '" but the expected type is "' + exTypeName + '"'
                      )
                    } else if (exTypeName === 'Interface') {
                      if (acTypeName === 'Class') {
                        throw Error(
                          'The type of value for property "' + key +
                          '" is invalid because:\n' +
                          'the assigned class instance does not implement the expected interface type'
                        )
                      } else {
                        throw Error(
                          'The type of value for property "' + key +
                          '" is invalid because:\n' +
                          'the assigned value type is:"' + acTypeName +
                          '" but the expected type is "' + exTypeName + '"'
                        )
                      }
                    } else if (exTypeName === 'Class') {
                      if (acTypeName === 'Class') {
                        throw Error(
                          'The type of value for property "' + key +
                          '" is invalid because:\n' +
                          'the assigned class instance is not the expected type of Class'
                        )
                      } else {
                        throw Error(
                          'The type of value for property "' + key +
                          '" is invalid because:\n' +
                          'the assigned value type is:"' + acTypeName +
                          '" but the expected type is "' + exTypeName + '"'
                        )
                      }
                    } else {
                      throw Error(
                        'The type of value for property "' + key +
                        '" is invalid because of unknown issue'
                      )
                    }
                  }
                }
              })
            }
          })
        }
      }
      withAnnotationCapabilities = function (metaInfo) {
        return {
          isAnnotationPresent: function (annotation) {
            return Boolean(
              annotationUtil.annotationPresentCheckFn(annotation, metaInfo)
            )
          },
          getAnnotationInstance: function (annotation) {
            return annotationUtil.annotationPresentCheckFn(annotation, metaInfo)
          }
        }
      }
      var clsMethodUtil = {
        getMethodFromMap: function (methodName, params, methodType, map) {
          var mapType = methodType || MethodType.INSTANCE
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
          findResult = clsMethodUtil.findMethodByComparingParameter(params,
            map[mapType][methodName])
          if (!findResult.errors) {
            result.method = findResult.method
            result.isFound = true
          } else {
            result.errors = 'method "' + methodName +
              '" is not found because ' + findResult.errors
          }
          return result
        },
        makeMethodMap: function (methodsInfo) {
          var map = {}
          _.forEach(methodsInfo, function (methodInfo) {
            var methodNameIndex
            // assign empty object if the method name property is not assigned yet
            // the key will be property length
            if (!(methodNameIndex = map[methodInfo.name])) {
              methodNameIndex = {}
              map[methodInfo.name] = methodNameIndex
            }
            var methodParamLengthIndex
            // create param index if the method has the params
            var paramLength = _.isArray(methodInfo.params) ? methodInfo.params.length : 0
            if (!(methodParamLengthIndex = methodNameIndex[paramLength])) {
              methodParamLengthIndex = []
              methodNameIndex[paramLength] = methodParamLengthIndex
            }
            var methodParams
            if (_.isArray(methodInfo.params)) {
              methodParams = _.map(
                methodInfo.params,
                function (param) {
                  return _.assign(param, withAnnotationCapabilities(param))
                })
            }
            methodParamLengthIndex.push({
              params: methodParams,
              methodFn: methodInfo.method,
              annotations: methodInfo.annotations,
              getParams: function () {
                return this.params
              }
            })
          })
          return map
        },
        findMethodFromClass: function (tClass, methodName, methodType, args) {
          var result = {
            isFound: false,
            method: null,
            errors: ''
          }
          var searchResult = clsMethodUtil.getMethodFromMap(
            methodName,
            args,
            methodType,
            tClass.class.methodMap
          )
          if (searchResult.isFound) {
            result.method = searchResult.method
            result.isFound = true
          } else {
            if (tClass.class.parentClass) {
              return clsMethodUtil.findMethodFromClass(
                tClass.class.parentClass,
                methodName, methodType, args
              )
            } else {
              result.errors = [
                'Method name: ' + methodName,
                'with arguments: ' + args.toString(),
                'with method type: ' + methodType,
                ' can not be found'
              ].join(' ')
            }
          }
          return result
        },
        executeInstanceMethod: function (targetClass, targetClassInstance, methodName, args) {
          var executionResult
          var methodType = methodName === 'construct'
            ? MethodType.CONSTRUCT
            : MethodType.INSTANCE
          var searchResult = clsMethodUtil.findMethodFromClass(
            targetClass,
            methodName,
            methodType,
            args
          )
          if (searchResult.isFound) {
            clsMethodUtil.recordMethodCall('before', methodName,
              arguments, searchResult.method.methodFn, targetClassInstance, targetClass)
            executionResult = searchResult.method.methodFn.apply(targetClassInstance, args, targetClass)
            clsMethodUtil.recordMethodCall('after', methodName,
              arguments, searchResult.method.methodFn, targetClassInstance, targetClass)
            return executionResult
          } else {
            if (!_.isEmpty(searchResult.errors)) {
              throw Error('Unable to find the method because : ' + searchResult.errors)
            } else {
              throw Error('Unable to find the method because of unknown cause')
            }
          }
        },
        findMethodByComparingParameter: function (rawParams, declaredMethods) {
          var result = {
            errors: '',
            method: undefined
          }
          // used to skip search if the method has been found
          var isMethodFound
          var paramMethods = declaredMethods[rawParams.length]
          _.forEach(paramMethods, function (paramMethod) {
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
            if (_.isUndefined(paramsInfo) || _.isEmpty(paramsInfo)) {
              isMatched = true
            } else {
              _.forEach(paramsInfo, function (paramInfo, paramIndex) {
                var rawParam = rawParams[paramIndex]
                if (!continueCheck) {
                  return
                }
                if (commonUtil.checkValueType(rawParam, paramInfo.type)) {
                  isMatched = true
                } else {
                  isMatched = false
                  continueCheck = false
                  result.errors = 'the parameter at the position #' +
                    (paramIndex + 1) +
                    ' is not matched with expected parameter type'
                }
              })
            }
            if (isMatched) {
              result.method = paramMethod
              isMethodFound = true
            }
          })
          return result
        },
        getCurrentMethodCallInfo: function (context) {
          return context.__runtime.currentCallInfo
        },
        getLastMethodCallInfo: function (context) {
          return context.__runtime.lastCallInfo
        },
        recordMethodCall: function (tagName, name, args, methodFn, context, targetClass) {
          var callInfo = {
            methodName: name,
            args: args,
            method: methodFn,
            targetInstance: context,
            targetCls: targetClass
          }
          if (tagName === 'before') {
            callInfo = _.assignIn(callInfo, { tagName: 'before' })
            context.__runtime.currentCallInfo = callInfo
          }
          if (tagName === 'after') {
            callInfo = _.assignIn(callInfo, { tagName: 'after' })
            context.__runtime.lastCallInfo = callInfo
          }
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
            throw Error('parent interface is invalid')
          }
          return ifs
        }

        parentIfs = extractParentIfInfo(pIfs)
        extractionResult = metaExtractFunction(metaInfo, parentIfs,
          ifMetaExtractionRule)
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
              MethodType.CONSTRUCT,
              methodMap
            )
            clsPropertyUtil.assignProperties(
              XClass.class, this, allProperties, allNonSharedValueProperties
            )
            this.$ = XClass._statics
            this.__runtime = {}
            if (searchResult.isFound) {
              clsMethodUtil.recordMethodCall('before', 'construct', arguments,
                searchResult.method.methodFn, this, XClass)
              searchResult.method.methodFn.apply(this, arguments)
              clsMethodUtil.recordMethodCall('after', 'construct', arguments,
                searchResult.method.methodFn, this, XClass)
            }
          }

          methodMap = {}
          _.forEach(MethodType, function (value) {
            methodMap[value] = {}
          })

          // populate constructor methods
          methodMap[MethodType.CONSTRUCT] = clsMethodUtil.makeMethodMap(
            cleanMetaInfo.construct)

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
          _.forEach(metaStaticPropsInfo, function (propInfo) {
            XClass._statics[propInfo.name] = _.isArray(propInfo.defaultValue)
              ? _.clone(propInfo.defaultValue) : propInfo.defaultValue
          })
          XClass.$ = XClass._statics

          // populate static methods
          var metaStaticMethodsInfo = cleanMetaInfo.staticMethods
          methodMap[MethodType.STATIC] = clsMethodUtil.makeMethodMap(
            metaStaticMethodsInfo)
          _.forEach(metaStaticMethodsInfo, function (methodInfo) {
            XClass[methodInfo.name] = (function (pMethodInfo) {
              return function () {
                var searchResult = clsMethodUtil.getMethodFromMap(
                  pMethodInfo.name,
                  arguments,
                  MethodType.STATIC,
                  methodMap
                )
                if (searchResult.isFound) {
                  return searchResult.method.methodFn.apply(this, arguments)
                } else {
                  throw Error(searchResult.errors)
                }
              }
            })(methodInfo)
          })

          // Define inheritance
          if (!_.isEmpty(parentClass)) {
            if (parentClass !== Error) {
              XClass.prototype = _.create(parentClass.prototype)
            } else {
              XClass.prototype = _.create(Error.prototype)
            }
          } else {
            XClass.prototype = _.create(XObject.prototype)
          }

          XClass.prototype._construct = function () {
            var targetCls
            var currentCallInfo = clsMethodUtil.getCurrentMethodCallInfo(this)
            targetCls = currentCallInfo.targetCls
            return clsMethodUtil.executeInstanceMethod(targetCls, this, 'construct', arguments)
          }

          XClass.prototype._callParent = function () {
            var methodName
            var currentCallInfo = clsMethodUtil.getCurrentMethodCallInfo(this)
            var targetCls = currentCallInfo.targetCls.class.parentClass
            if (_.isEmpty(targetCls)) {
              throw new Error('Parent class is not found')
            }
            var args = arguments
            // while the arguments is passed as parameter, arguments[0] is the original function arguments
            // otherwise, it will take the actual parameters passed in for callParent function
            if (arguments.length > 0 && _.isFunction(arguments[0].callee)) {
              args = arguments[0]
            }
            methodName = clsMethodUtil.getCurrentMethodCallInfo(this).methodName
            return clsMethodUtil.executeInstanceMethod(targetCls, this, methodName, args)
          }

          // populate instance methods
          var metaMethodsInfo = cleanMetaInfo.methods
          methodMap[MethodType.INSTANCE] = clsMethodUtil.makeMethodMap(
            metaMethodsInfo)
          _.forEach(metaMethodsInfo, function (methodInfo) {
            XClass.prototype[methodInfo.name] = (function () {
              return function () {
                return clsMethodUtil.executeInstanceMethod(XClass, this, methodInfo.name, arguments)
              }
            })()
          })

          // adding meta property to the class
          XClass.class = _.assign(
            {
              classInfo: cleanMetaInfo,
              methodMap: methodMap,
              implements: (_.isEmpty(cleanMetaInfo.implements)
                ? []
                : cleanMetaInfo.implements),
              parentClass: parentClass,
              _getMethod: function (type, args) {
                if (args.length < 1) {
                  throw new Error('Must pass method name')
                }
                var methodName = args[0]
                if (args.length > 1) {
                  if (args.length === 2 && _.isArguments(args[1])) {
                    args = args[1]
                  } else {
                    args = _.slice(args, 1)
                  }
                } else {
                  args = []
                }
                var searchResult = clsMethodUtil.getMethodFromMap(
                  methodName, args, type, methodMap
                )
                var rawMethodMeta = searchResult.method
                return _.assign(rawMethodMeta, withAnnotationCapabilities(rawMethodMeta))
              },
              getStaticMethod: function () {
                return this._getMethod(MethodType.STATIC, arguments)
              },
              getInstanceMethod: function () {
                return this._getMethod(MethodType.INSTANCE, arguments)
              },
              getInstanceProperty: function (name) {
                var rawPropertyMeta = _.find(cleanMetaInfo.props, { 'name': name })
                return _.assign(rawPropertyMeta, withAnnotationCapabilities(rawPropertyMeta))
              },
              getStaticProperty: function (name) {
                var rawPropertyMeta = _.find(cleanMetaInfo.staticProps, { 'name': name })
                return _.assign(rawPropertyMeta, withAnnotationCapabilities(rawPropertyMeta))
              }
            },

            withAnnotationCapabilities(metaInfo)
          )

          XClass.isCustomClass = true

          // add newInstance method
          XClass.newInstance = function () {
            var instance = _.create(XClass.prototype)
            XClass.apply(instance, arguments)
            return instance
          }

          // add tools set
          XClass.prototype.self = function () {
            return XClass
          }

          XClass.prototype.$ = XClass.prototype.self = function () {
            return XClass
          }

          XClass.prototype.getXClass = function () {
            return XClass.class
          }

          XClass.prototype._supportInterfaceOf = function (face) {
            function hasIf (cls) {
              if (!_.isEmpty(cls.class.implements)) {
                if (_.includes(cls.class.implements, face)) {
                  return true
                } else {
                  if (!_.isEmpty(cls.class.parentClass)) {
                    return hasIf(cls.class.parentClass)
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
        extractionResult = metaExtractFunction(metaInfo, parentClass,
          classMetaExtractionRule)
        builtCls = build(extractionResult.resultMetaInfo, parentClassInfo)

        var result = clsValidator.validate(builtCls)

        if (_.isEmpty(result)) {
          return builtCls
        } else {
          throw Error(result)
        }
      }
      root.createStructure = function (metaInfo) {
        var extractionResult
        var Structure
        var metaProperties = {}

        function build (cleanMetaInfo) {
          _.forEach(cleanMetaInfo.props,
            function (prop) {
              metaProperties[prop.name] = prop
            }
          )
          Structure = function (props) {
            var me = this
            var properties = _.clone(props)
            properties = _.isEmpty(properties) ? {} : properties
            _.forEach(cleanMetaInfo.props,
              function (prop) {
                Object.defineProperty(me, prop.name, {
                  enumerable: true,
                  configurable: false,
                  get: function () {
                    return _.get(properties, prop.name, prop.defaultValue)
                  },
                  set: function (v) {
                    _.set(properties, prop.name, v)
                  }
                })
              }
            )
          }
          Structure.prototype = _.create(XStructure)
          Structure.class = {
            props: {}
          }
          Structure.valueOf = function (properties) {
            _.forEach(properties,
              function (value, key) {
                if (
                  !_.find(
                    cleanMetaInfo.props,
                    ['name', key]
                  )) {
                  throw new Error(
                    'the property name "' +
                    key +
                    '" is not valid property name in the structure')
                }
              }
            )
            return new Structure(properties)
          }
          Structure.getProperties = function () {
            return metaProperties
          }
          Structure.isStructureure = true
          return Structure
        }

        extractionResult = metaExtractFunction(metaInfo, null, structureExtractionRule)
        return build(extractionResult.resultMetaInfo)
      }
      root.createAnnotation = function (metaInfo) {
        var extractionResult
        var Annotation
        var metaProperties = {}

        function build (cleanMetaInfo) {
          _.forEach(cleanMetaInfo.props,
            function (prop) {
              metaProperties[prop.name] = prop
            }
          )
          Annotation = function (props) {
            var me = this
            var properties = _.clone(props)
            properties = _.isEmpty(properties) ? {} : properties
            _.forEach(cleanMetaInfo.props,
              function (prop) {
                Object.defineProperty(me, prop.name, {
                  enumerable: true,
                  configurable: false,
                  get: function () {
                    return _.get(properties, prop.name, prop.defaultValue)
                  },
                  set: function (v) {
                    _.set(properties, prop.name, v)
                  }
                })
              }
            )
          }
          Annotation.prototype = _.create(XAnnotation)
          Annotation.valueOf = function (properties) {
            _.forEach(properties,
              function (value, key) {
                if (
                  !_.find(
                    cleanMetaInfo.props,
                    ['name', key]
                  )) {
                  throw new Error(
                    'the property name "' +
                    key +
                    '" is not valid property name in the structure')
                }
              }
            )
            return new Annotation(properties)
          }
          Annotation.getProperties = function () {
            return metaProperties
          }
          Annotation.isAnnotation = true
          return Annotation
        }

        extractionResult = metaExtractFunction(metaInfo, null, structureExtractionRule)
        return build(extractionResult.resultMetaInfo)
      }

      root.isCustomClass = function (cls) {
        return cls && cls.isCustomClass
      }
      root.isTypeOfClass = function (obj) {
        return obj && obj instanceof XObject
      }
      root.isCustomIf = function (customIf) {
        return customIf && customIf.isCustomIf
      }
      root.isStructure = function (structure) {
        return structure && structure.isStructureure
      }
      root.isTypeOfStructure = function (obj) {
        return obj instanceof XStructure
      }
      root.util = (function () {
        return exportedUtil
      })()
    }

    function prepareReturn () {
      root.noConflict = function () {
        throw new Error('xwebjs only works when _x is used as a global')
      }
      root.features = {}
      root.XObject = XObject
      root.features.isLangCore = true
      return root
    }

    init()
    setup()
    return prepareReturn()
  }
)()
