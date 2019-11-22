describe('System module loader', function () {
  beforeEach(function () {
    // eslint-disable-next-line no-undef
    jasmine.addMatchers(objectMatcher)
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000
  })
  it('Load boot module library from web server', function (done) {
    _x.initVM().then(
      function () {
        // @Given
        var vm = _x.getRootVM()
        vm.setConfiguration({
          vmInfo: {
            loader: {
              bootPath: '/test3/vm/boot',
              extPath: '/test3/vm/ext'
            },
            bootModules: [
              'test.boot:1.0'
            ],
            extModules: [
              'test.ext:1.0'
            ]
          },
          mainProgramInfo: {
            loader: {
              basePath: '/test3/program'
            },
            appModules: [
              'test.app:1.0'
            ],
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
  })
})
