/* eslint-disable no-unused-vars */
var objectMatcher = {
  isTypeOf: function (util, eqTesters) {
    return {
      compare: function (actual, expected) {
        var result = {}

        if (_.isFunction(expected) && _.isObject(actual)) {
          if (actual instanceof expected) {
            result.pass = true
          } else {
            result.pass = false
            result.message = 'Expected ' + expected + ' to be type of ' + actual + ',but it is not'
          }
        } else {
          result.pass = false
          result.message = 'The "Actual" parameter should be object type and "Expected" parameter type should be function type'
        }

        return result
      }
    }
  },
  isMethodOf: function (util, eqTesters) {
    return {
      compare: function (actual, expected) {
        var result = {}

        if (_.isString(actual) && _.isObject(expected)) {
          if (expected[actual] && typeof expected[actual] === 'function') {
            result.pass = true
          } else {
            result.pass = false
            result.message = 'Expected ' + expected + ' contains the method ' + actual + ',but it does\'t'
          }
        } else {
          result.pass = false
          result.message = 'The "Actual" parameter must be string type and the "Expected" parameter must be object type'
        }

        return result
      }
    }
  }
}
var methodMetaMatchers = {
  hasMethodMeta: function (util, customEqualityTesters) {
    return {
      compare: function (obj, method) {
        var result = {
          pass: true
        }
        var methods = obj.getMethods()
        var foundMethod = false
        var methodValidationInfo = ''
        var methodValidationCheckResult
        _.each(methods, function (actual, index, list) {
          methodValidationCheckResult = true
          if (foundMethod) {
            return
          }
          if (actual.name === method.name) {
            if (actual.params.length !== method.params.length) {
              methodValidationCheckResult = false
              methodValidationInfo += 'The method "' + method.name + '" parameters length is not consistent with expected method one. The expected length is ' + method.params.length + ' but the actual one is ' + actual.params.length + '\n'
            }
            _.each(method.params, function (param, index, list) {
              if (!methodValidationCheckResult) {
                return
              }
              var actualParam = actual.params[index]
              if (param.type !== actualParam.type) {
                methodValidationCheckResult = false
                methodValidationInfo += 'For the method "' + method.name + '" with parameters length ' + actual.params.length + ',  The parameter position at ' + index + ' is not consistent with the expected method one. Expected one is ' + param.type + ', but the actual one is ' + actualParam.type + '\n'
              }
            }, this)
            if (methodValidationCheckResult) {
              foundMethod = true
            }
          }
        }, this)
        if (!foundMethod) {
          result.pass = false
          result.message = 'No method with name ' + method.name + ' with required parameters is found because: \n' + methodValidationInfo
        }
        return result
      }
    }
  }
}
