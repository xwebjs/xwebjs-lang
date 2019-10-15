describe('System module loader', function () {
  beforeEach(function () {
    // eslint-disable-next-line no-undef
    jasmine.addMatchers(objectMatcher)
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000
  })
  it('Load vm boot modules from web server', function (done) {
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
  })
})
