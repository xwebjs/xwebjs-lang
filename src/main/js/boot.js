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

var scriptUtil = {
  loadError: function (oError) {
    throw new URIError('The script ' + oError.target.src + ' didn\'t load correctly.')
  },
  affixScriptToHead: function (url, onloadFunction) {
    var newScript = document.createElement('script')
    newScript.onerror = scriptUtil.loadError
    if (onloadFunction) { newScript.onload = onloadFunction }
    document.head.appendChild(newScript)
    newScript.src = url
  }
}

function readConfigs () {
}

function loadDependentLibs (libs) {
  return undefined
}

function loadEntryModule (entryModules) {
  return undefined
}

// eslint-disable-next-line no-unused-vars
function init () {
  enableCache()
  readConfigs().then(
    function (settings) {
      return loadDependentLibs(settings.libs)
    },
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
