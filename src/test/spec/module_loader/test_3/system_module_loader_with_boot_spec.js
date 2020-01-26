describe('System module loader', function () {
  beforeEach(function () {
    // eslint-disable-next-line no-undef
    jasmine.addMatchers(objectMatcher)
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000
  })
  it('Load boot module library from web server', function (done) {
    _x.initVM().then(
      function () {
        // @Given
        var vm = _x.getRootVM()
        vm.setConfiguration({
          vmInfo: {
            loader: {
              bootLibPath: '/test3/vm/boot',
              extLibPath: '/test3/vm/ext'
            },
            bootModules: [
              'Core'
            ],
            extModules: [
              'Ext', 'common.MagicCollection'
            ],
            bootLibs: [
              'test.boot:1.0'
            ],
            extLibs: [
              'test.ext:1.0'
            ]
          },
          mainProgramInfo: {
            loader: {
              basePath: '/test3/program',
              baseLibPath: '/test3/program'
            },
            appLibs: [
              'test.app:1.0'
            ],
            entryClassName: 'MainProgram',
            programId: 'TestProgram3'
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
