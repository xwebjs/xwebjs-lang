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
var isDBEnabled = false
var enableCoreFileCache = false

if (Conf.cache && typeof Conf.cache.core === 'boolean') {
  enableCorFileCache = Conf.cache.core
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
    systemDB.on(
      'ready',
      function () {
        isDBEnabled = true
        defer.resolve()
      }
    )
    systemDB.open()
    return defer.promise
  } catch (error) {
    console.error('Failed to setup the system index DB because:' + error.oetMessage())
  }
}

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
  event.respondWith(
    caches.match(event.request).then(
      function (response) {
        if (response) {
          return response
        } else {
          // eslint-disable-next-line lodash/prefer-includes
          if (event.request.url.indexOf('/xwebjs_module') !== -1) {
            console.log('Fetching module content from index DB:' + event.request.url)
            if (isDBEnabled) {
              return generateModuleFileCode(event.request)
            } else {
              return enableDB().then(
                function () {
                  return generateModuleFileCode(event.request)
                }
              )
            }
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

function generateModuleFileCode (request) {
  var requestId
  var contextId
  var modulePath
  var reg = /https?:\/\/[\w|.|\d|:]+\/xwebjs_module\/(.+)\/(.+)/
  var results = reg.exec(request.url)
  contextId = results[1]
  modulePath = results[2]
  var requestId = 'xwebjs.' + contextId + '.' + modulePath.replace('/', '.')
  return getContextModuleCodes(contextId, modulePath).then(
    function (codes) {
      var prefix = '_x.exportModule('
      var fcodes
      codes = codes[0].content
      if (codes.substr(0, prefix.length) === prefix) {
        fcodes = prefix + '\'' +
          requestId + '\',' +
          codes.slice(prefix.length)
        return new Response(fcodes)
      } else {
        throw Error('Invalid module content')
      }
    },
    function () {
      console.warn('Logically, this case should not happen as module resource should have been cached in the indexDB for the first time loading')
      request.url = modulePath.replace('.', '/')
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
  return systemDB.moduleCodes
  .where('[contextId+modulePath]').equals([contextId, modulePath])
  .toArray()
}
