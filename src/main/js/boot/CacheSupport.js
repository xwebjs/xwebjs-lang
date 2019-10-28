var CACHE_NAME = 'xwebjs_cache'
var cachedFiles = [
  '/',
  '/index.html',
  '/boot.js',
  '/libs/q.js',
  '/libs/xwebjs.js',
  '/config/conf.js'
]

self.addEventListener(
  'install',
  function (event) {
    console.log('Service worker is installed')
    console.log('Caching files')
    event.waitUntil(
      caches.open(CACHE_NAME)
      .then(function (cache) {
        console.log('Opened cache, and caching files')
        return cache.addAll(cachedFiles)
      })
    )
  }
)

self.addEventListener(
  'activate',
  function (e) {
    console.log('Service worker is activated')
  }
)

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request)
    .then(
      function (response) {
        // Cache hit - return response
        if (response) {
          console.log('Loaded resource from the cache:' + event.request)
          return response
        }
        return fetch(event.request.url)
      }
    )
  )
})
