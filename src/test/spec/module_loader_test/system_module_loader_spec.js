describe('System module loader', function () {
  beforeEach(function () {
    // eslint-disable-next-line no-undef
    jasmine.addMatchers(objectMatcher)
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000
  })
  it('Load modules from web server', function (done) {
    // @Given
    var system = _x.getSystem()
    system.setSystConfiguration({
      systemInfo: {
        loader: {
          basePath: '/system'
        },
        bootLibPath: '',
        extLibPath: ''
      },
      mainAppInfo: {
        loader: {
          basePath: '/app'
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
