describe('System module loader', function () {
  beforeEach(function () {
    // eslint-disable-next-line no-undef
    jasmine.addMatchers(objectMatcher)
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000
  })
  it('Load system boot modules from web server', function (done) {
    // @Given
    var system = _x.getSystem()
    system.setConfiguration({
      systemInfo: {
        loader: {
          bootPath: '/test2/system/boot',
          extPath: '/test2/system/ext'
        },
        bootModules: [
          'Core', 'common.Collection'
        ],
        extModules: [
          'Ext', 'common.MagicCollection'
        ]
      },
      mainAppInfo: {
        loader: {
          basePath: '/test2/app'
        },
        entryClassNames: 'MainApp'
      }
    })
    // @Then
    system.init().then(
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
})
