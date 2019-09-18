var Q
var libURLContext = '../../libs/'

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

function loadDependentLibs (libs) {
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
        '../../libs/' + libs[loadedLibNum] + '.js', onLoaded, onFailure
      )
      loadedLibNum++
    }
  }
  onLoaded(libs[loadedLibNum])
  return deferred.promise
}

function loadEntryModule (entryModules) {
  return undefined
}

// eslint-disable-next-line no-unused-vars
function init () {
  // enableCache()
  enablePromise(
    function () {
      // eslint-disable-next-line no-undef
      loadDependentLibs(XConfig.libs).then(
        function (reason) {
          alert('Failed to load dependent libraries')
        },
        function (progress) {
          console.log('progress:' + progress)
        }
      ).then(
        function (settings) {
          return loadEntryModule(settings.entryModules)
        }
      )
    }
  )
}

window.onload = init
