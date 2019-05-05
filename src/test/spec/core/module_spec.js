describe('Support module context', function () {
  var nsCtx
  beforeEach(function () {
    nsCtx = _x.createModuleContext()
  })
  describe('declare module without attaching the module into the package', function () {
    it('Throw exception if not containing the valid class or interface', function () {
      try {
        var module = _x.defineModule({}, function () {})
        module.getContent()
        fail('Expect to throw exception, but it does not')
      } catch (e) {
        expect(e.message.toLowerCase()).toContain('Module content must be custom class or interface type'.toLowerCase())
      }
    })
    it('Return the newly created module if containing the valid class or interface', function () {
      try {
        var module = _x.defineModule({}, _x.createCls())
        expect(module.getContent().isCustomClass).toBeTruthy()
      } catch (e) {
        fail('Should not throw exception \n' + e.message)
      }
      try {
        module = _x.defineModule({}, _x.createIf())
        expect(module.getContent().isCustomIf).toBeTruthy()
      } catch (e) {
        fail('Should not throw exception \n' + e.message)
      }
    })
  })
  describe('declare module and register it into package', function () {
    it('declare module with package and module name', function () {
      var newModule = _x.defineModule({}, _x.createCls())
      nsCtx.register('test.p1.ClassA', newModule)
      var module = nsCtx.getModule('test.p1.ClassA')
      expect(module.getContent().isCustomClass).toBeTruthy()
    })
    it('declare module with module name only', function () {
      try {
        nsCtx.register(
          'ClassA',
          _x.defineModule({}, _x.createCls())
        )
        expect(nsCtx.getContextPackage().modules['ClassA'].getContent().isCustomClass).toBeTruthy()
      } catch (e) {
        fail('Should not throw exception \n' + e.message)
      }
    })
  })
  describe('get module', function () {
    beforeEach(function () {
      nsCtx.register(
        'test.p1.ClassA',
        _x.defineModule(
          _x.createCls()
        )
      )
      nsCtx.register(
        'test.p1.InterfaceA',
        _x.defineModule(
          _x.createIf()
        )
      )
    })
    it('get module by full name', function () {
      var module = nsCtx.getModule('test.p1.ClassA')
      expect(module.getContent().isCustomClass).toBeTruthy()
    })
    it('get class from module', function () {
      var module = nsCtx.getModule('test.p1.ClassA')
      expect(module.getClass().isCustomClass).toBeTruthy()
    })
    it('get interface from module', function () {
      var module = nsCtx.getModule('test.p1.InterfaceA')
      expect(module.getInterface().isCustomIf).toBeTruthy()
    })
    it('get invalid class from module', function () {
      var module = nsCtx.getModule('test.p1.InterfaceA')
      try {
        module.getInterface()
      } catch (e) {
        expect(e.message === 'Module content is not class').toBeTruthy()
      }
    })
    it('get invalid interface from module', function () {
      var module = nsCtx.getModule('test.p1.ClassA')
      try {
        module.getClass()
      } catch (e) {
        expect(e.message === 'Module content is not interface').toBeTruthy()
      }
    })
  })
  describe('remove module from the package', function () {
    beforeEach(function () {
      if (!nsCtx.hasModule('test.p1.ClassA')) {
        nsCtx.register(
          'test.p1.ClassA',
          _x.defineModule({}, _x.createCls())
        )
      }
    })
    it('remove module from specified package', function () {
      nsCtx.removeModule('test.p1.ClassA')
      expect(!_.has(nsCtx.getContextPackage().packages.test.packages.p1.modules, 'ClassA')).toBeTruthy()
    })
  })
})
