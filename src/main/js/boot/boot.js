var Q, XConfig
var libURLContext = '../../libs/'
var featureURLContext = '../js/lang/'
var mainFn

// enable cache
function enableCache () {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(
      'cache/FileCacheSupport.js',
      {
        scope: './'
      }
    ).then(
      function (registration) {
        console.log('The file cache support service worker has been registered successfully')
      }
    ).catch(
      function (reason) {
        console.log('Failed to register the file cache support:' + reason)
      }
    )
  }
}

function enablePromise (cb) {
  scriptUtil.load(
    libURLContext + 'q.js',
    function () {
      cb()
    }
  )
}

var scriptUtil = {
  load: function (url, onLoadedFunction, onError) {
    var newScript = document.createElement('script')
    newScript.onerror = onError
    if (onLoadedFunction) { newScript.onload = onLoadedFunction }
    document.head.appendChild(newScript)
    newScript.src = url
  }
}

function loadDependentLibs (contextPath, libs) {
  // eslint-disable-next-line lodash/prefer-lodash-method
  var loadedLibNum = 0
  // eslint-disable-next-line lodash/prefer-lodash-method
  var deferred = Q.defer()
  var onFailure = function (err) {
    console.log('Failed to load lib:' + libs[loadedLibNum] + ' because:' + err)
  }
  var onLoaded = function (lib) {
    console.log('Library ' + libs[loadedLibNum] + ' is loaded')
    if (loadedLibNum === libs.length - 1) {
      deferred.resolve()
    } else {
      scriptUtil.load(
        contextPath + libs[loadedLibNum] + '.js', onLoaded, onFailure
      )
      loadedLibNum++
    }
  }
  scriptUtil.load(contextPath + libs[loadedLibNum] + '.js', onLoaded, onFailure)
  return deferred.promise
}

function loadFeatures (features) {
  return loadDependentLibs(featureURLContext, features)
}

function loadEntryModule (entryModules) {
  return Q()
}

function invokeMainFn () {
  // eslint-disable-next-line no-undef
  if (!_.isFunction(mainFn)) {
    console.log('The implementation of entry main function is not defined')
    return 0
  }
  mainFn()
}

// eslint-disable-next-line no-unused-vars
function init () {
  // enableCache()
  enablePromise(
    function () {
      loadDependentLibs(libURLContext, XConfig.libs)
      .then(
        function () {
          return loadFeatures(XConfig.features)
        }
      ).then(
        function () {
          return loadEntryModule(XConfig.entryModules)
        }
      ).then(
        function () {
          invokeMainFn()
        }
      ).catch(
        function (error) {
          console.log('Failed to start the program because:' + error)
        }
      )
    }
  )
}

window.onload = init
