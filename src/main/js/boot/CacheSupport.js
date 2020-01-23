importScripts('/libs/dexie.js', '/libs/q.js', '/config/conf.js')
var CACHE_NAME = 'xwebjs_cache'
var Conf
var cachedCoreFiles = [
  '/',
  '/index.html',
  '/boot.js',
  '/libs/q.js',
  '/libs/xwebjs.js',
  '/config/conf.js'
]

var systemDB
var enableCoreFileCache = false

var FIlE_TYPE = {
  LIB: 'LIB',
  MODULE: 'MODULE'
}

if (Conf.cache && typeof Conf.cache.core === 'boolean') {
  enableCoreFileCache = Conf.cache.core
}

if (!enableCoreFileCache) {
  cachedCoreFiles = []
}

function enableDB () {
  var defer = Q.defer()
  try {
    systemDB = new Dexie('xwebjs_system')
    systemDB.version(1).stores(
      {
        moduleCodes: 'moduleId,[contextId+modulePath]'
      }
    )
    systemDB.open()
    return defer.promise
  } catch (error) {
    console.error('Failed to setup the system index DB because:' + error.oetMessage())
  }
}

enableDB()
self.addEventListener(
  'install',
  function (event) {
    console.log('Service worker is installed')
    console.log('Caching files')
    self.skipWaiting()
    event.waitUntil(
      caches.open(CACHE_NAME)
      .then(function (cache) {
        console.log('Opened cache, and caching files')
        cache.addAll(cachedCoreFiles)
      })
    )
  }
)
self.addEventListener(
  'activate',
  function (e) {
    console.log('Service worker is activated')
    self.clients.claim()
  }
)
self.addEventListener('fetch', function (event) {
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
    return
  }
  event.respondWith(
    caches.match(event.request).then(
      function (response) {
        if (response) {
          return response
        } else {
          // eslint-disable-next-line lodash/prefer-includes
          if (event.request.url.indexOf('/xwebjs_module') !== -1) {
            console.log('Fetching module content from index DB:' + event.request.url)
            return generateFileCode(event.request, FIlE_TYPE.MODULE)
          } else if (event.request.url.indexOf('/xwebjs_libs') !== -1) {
            console.log('Fetching library content from index DB:' + event.request.url)
            return generateFileCode(event.request, FIlE_TYPE.LIB)
          } else {
            return fetch(event.request).then(function (response) {
              console.log('Response from network is:', response)
              return response
            }).catch(function (error) {
              console.error('Fetching failed:', error)
              throw error
            })
          }
        }
      }
    )
  )
})

function generateFileCode (request, fileType) {
  var requestId
  var contextId
  var filePath
  var reg
  var results
  var getFileFn
  var parseFileFn

  if (fileType === FIlE_TYPE.MODULE) {
    reg = /https?:\/\/[\w|.|\d|:]+\/xwebjs_module\/(.+)\/(.+)/
    getFileFn = getContextModuleCodes
    parseFileFn = parseModuleFileContent
  } else {
    reg = /https?:\/\/[\w|.|\d|:]+\/xwebjs_lib\/(.+)\/(.+)/
    getFileFn = getContextLibraryCodes
    parseFileFn = parseLibFileContent
  }
  results = reg.exec(request.url)
  contextId = results[1]
  filePath = results[2]
  requestId = 'xwebjs.' + contextId + '.' + filePath.replace('/', '.')

  function parseModuleFileContent (codes) {
    var prefix = '_x.exportModule('
    var fCodes
    codes = codes[0].content
    if (codes.substr(0, prefix.length) === prefix) {
      fCodes = prefix + '\'' + requestId + '\',' + codes.slice(prefix.length)
      return new Response(fCodes)
    } else {
      throw new Error('Invalid module file content')
    }
  }
  function parseLibFileContent (codes) {
    var prefix = '_x.exportModule('
    var fCodes
    codes = codes[0].content
    if (codes.substr(0, prefix.length) === prefix) {
      fCodes = prefix + '\'' + requestId + '\',' + codes.slice(prefix.length)
      return new Response(fCodes)
    } else {
      throw new Error('Invalid lib file content')
    }
  }

  return getFileFn.call(this, contextId, filePath).then(
    parseFileFn,
    function () {
      console.warn('Logically, this case should not happen as supported module or library resource should have been cached in the indexDB for the first time loading')
      request.url = filePath.replace('.', '/')
      return fetch(request).then(function (response) {
        console.log('Response from network is:', response)
        return response
      }).catch(function (error) {
        console.error('Fetching failed:', error)
        throw error
      })
    }
  )
}

function getContextModuleCodes (contextId, modulePath) {
  return Q.promise(
    function (resolve, reject, notify) {
      systemDB.on(
        'ready',
        function () {
          resolve(systemDB.moduleCodes
          .where('[contextId+modulePath]').equals([contextId, modulePath])
          .toArray())
        }
      )
    }
  )
}
function getContextLibraryCodes (contextId, libPath) {
  return Q.promise(
    function (resolve, reject, notify) {
      systemDB.on(
        'ready',
        function () {
          resolve(systemDB.moduleCodes
          .where('[contextId+libPath]').equals([contextId, libPath])
          .toArray())
        }
      )
    }
  )
}
