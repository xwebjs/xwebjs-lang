var Q
var Conf
var main
var libURLContext =
  Conf.core.libContextURL ? Conf.core.libContextURL : '/libs/'
var coreLibs = Conf.core.libs

function enableCache () {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.register(
      'CacheSupport.js',
      {
        scope: '/'
      }
    ).then(
      function (registration) {
        console.log('The file cache support service worker has been registered successfully')
      }
    ).catch(
      function (reason) {
        console.log('Failed to register the cache support:' + reason)
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
    loadedLibNum++
    if (loadedLibNum === libs.length) {
      deferred.resolve()
    } else {
      scriptUtil.load(
        contextPath + libs[loadedLibNum] + '.js', onLoaded, onFailure
      )
    }
  }
  scriptUtil.load(contextPath + libs[loadedLibNum] + '.js', onLoaded, onFailure)
  return deferred.promise
}

function invokeMainFn () {
  if (Conf.entryType === 'M') {
    _x.initVM().then(
      function () {
        var vm = _x.getRootVM()
        vm.setConfiguration(_.clone(Conf))
        vm.init()
      }
    )
  } else {
    if (_.isFunction(main)) {
      main()
    } else {
      console.log('Main function or method is not defined')
    }
  }
}

// eslint-disable-next-line no-unused-vars
function init () {
  enableCache().then(
    function () {
      enablePromise(
        function () {
          loadDependentLibs(libURLContext, coreLibs)
          .then(
            function () {
              return Q.delay(500)
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
  )
}

window.onload = init
