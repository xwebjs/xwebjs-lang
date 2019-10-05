// File cache
self.addEventListener(
  'install',
  function (e) {
    console.log('Service worker is installed')
    e.waitUntil()
  }
)
self.addEventListener(
  'activate',
  function (e) {
    console.log('Service worker is activated')
  }
)
