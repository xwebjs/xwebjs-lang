describe('System module loader', function () {
  beforeAll(function () {
    // eslint-disable-next-line no-undef
    jasmine.addMatchers(objectMatcher)
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000
  })
  it('Load vm modules from web server', function (done) {
    // eslint-disable-next-line no-undef
    commonUtil.clearDB('before test 2').then(
      // eslint-disable-next-line no-undef
      commonUtil.enableCache,
      function (reason) {
        console.log('Failed to clear DB because:' + reason)
      }
    ).then(
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
                entryClassName: 'MainProgram',
                programId: 'TestProgram'
              }
            })
            // @Then
            vm.init().then(
              function (mainAppClass) {
                expect(mainAppClass.$.status === 'done').toBeTruthy()
                expect(mainAppClass.getCollectionSize() === 100).toBeTruthy()
              },
              function (errors) {
                fail()
              }
            ).then(function () {
              done()
            })
          })
      }
    )
  })
})
