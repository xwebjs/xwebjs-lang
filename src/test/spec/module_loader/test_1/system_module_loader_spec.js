describe('System module loader', function () {
  beforeEach(function () {
    // eslint-disable-next-line no-undef
    jasmine.addMatchers(objectMatcher)
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000
  })
  xit('Load program modules from web server', function (done) {
    _x.initVM().then(
      function () {
        // @Given
        var vm = _x.getRootVM()
        vm.setConfiguration({
          systemInfo: {
            loader: {},
            bootModulePath: [],
            extPath: []
          },
          mainProgramInfo: {
            loader: {
              basePath: '/test1/program'
            },
            entryClassName: 'MainProgram'
          }
        })
        // @Then
        vm.init().then(
          function (defaultApp) {
            expect(defaultApp.$.status === 'done').toBeTruthy()
            done()
          },
          function (errors) {
            fail()
            done()
          }
        )
      }
    )
  })
})
