describe('System module loader', function () {
  beforeEach(function () {
    // eslint-disable-next-line no-undef
    jasmine.addMatchers(objectMatcher)
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000
  })
  it('Load program modules from web server', function (done) {
    // eslint-disable-next-line no-undef
    commonUtil.enableCache().then(
      function () {
        _x.initVM().then(
          function () {
            // @Given
            var vm = _x.getRootVM()
            vm.setConfiguration({
              vmInfo: {
                loader: {},
                bootModules: [],
                extModules: []
              },
              mainProgramInfo: {
                loader: {
                  basePath: '/test1/program'
                },
                entryClassName: 'MainProgram',
                programId: 'TestProgram1'
              }
            })
            // @Then
            vm.init().then(
              function (mainAppClass) {
                expect(mainAppClass.$.status === 'done').toBeTruthy()
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
