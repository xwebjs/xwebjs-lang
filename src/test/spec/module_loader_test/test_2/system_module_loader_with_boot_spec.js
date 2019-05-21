describe('System module loader', function () {
  beforeEach(function () {
    // eslint-disable-next-line no-undef
    jasmine.addMatchers(objectMatcher)
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000
  })
  xit('Load system boot modules from web server', function (done) {
    // @Given
    var system = _x.getSystem()
    system.setSystConfiguration({
      systemInfo: {
        loader: {
          basePath: '/test2/system/',
          bootPath: '/boot/',
          extPath: '/ext/'
        },
        bootModulePath: [
          'Core'
        ],
        extPath: []
      },
      mainAppInfo: {
        loader: {
          basePath: '/test2/app/'
        },
        entryClassNames: 'MainApp'
      }
    })
    // @Then
    system.init().then(
      function (defaultApp) {
        expect(defaultApp.$.status === 'done').toBeTruthy()
        done()
      },
      function (errors) {
        fail()
        done()
      }
    )
  })
})
