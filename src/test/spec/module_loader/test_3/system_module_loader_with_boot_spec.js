describe('System module loader', function () {
  beforeAll(function () {
    // eslint-disable-next-line no-undef
    jasmine.addMatchers(objectMatcher)
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000
  })
  it('Load library from web server', function (done) {
    Q.delay(1).then(
      function (value) {
        // eslint-disable-next-line no-undef
        return commonUtil.clearDB('before test 3').then(
          // eslint-disable-next-line no-undef
          commonUtil.enableCache,
          function (reason) {
            console.log('Failed to clear DB because:' + reason)
          })
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
                  bootLibPath: '/test3/vm/boot',
                  extLibPath: '/test3/vm/ext'
                },
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
                  baseLibPath: '/test3/program/libs'
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
