describe('System module loader', function () {
  function enableCache () {
    if ('serviceWorker' in navigator) {
      return navigator.serviceWorker.register(
        '/CacheSupport.js',
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

  beforeEach(function () {
    // eslint-disable-next-line no-undef
    jasmine.addMatchers(objectMatcher)
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000
  })
  it('Load vm boot modules from web server', function (done) {
    enableCache().then(
      function () {
        _x.initVM().then(
          function () {
            // @Given
            var vm = _x.getRootVM()
            vm.setConfiguration({
              vmInfo: {
                loader: {
                  bootPath: '/test2/vm/boot',
                  extPath: '/test2/vm/ext'
                },
                bootModules: [
                  'Core'
                ],
                extModules: [
                  'Ext', 'common.MagicCollection'
                ]
              },
              mainProgramInfo: {
                loader: {
                  basePath: '/test2/program'
                },
                entryClassName: 'MainProgram'
              }
            })
            // @Then
            vm.init().then(
              function (mainAppClass) {
                expect(mainAppClass.$.status === 'done').toBeTruthy()
                expect(mainAppClass.getCollectionSize() === 100).toBeTruthy()
                done()
              },
              function (errors) {
                fail()
                done()
              }
            )
          })
      }
    )
  })
})
