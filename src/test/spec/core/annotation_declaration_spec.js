describe('Declare annotation', function () {
// eslint-disable-next-line no-unused-vars
  var spyBox
  beforeEach(function () {
    spyBox = jasmine.createSpyObj('', ['methodA', 'methodB', 'methodC', 'methodD'])
// eslint-disable-next-line no-undef
    jasmine.addMatchers(methodMetaMatchers)
  })
  describe('Declare simple annotation', function () {
    it('Check annotation type', function () {
      var annotation = _x.createAnnotation()
      expect(annotation.isAnnotation()).toBeTruthy()
    })
  })
  describe('Check the annotation on class', function () {
    it('Check whether the class has specific annotation when having only one annotation', function () {
      var annotation = _x.createAnnotation()
      var Person = _x.createCls(
        {
          annotations: [annotation]
        }
      )
      expect(Person.isAnnotationPresent(annotation)).toBeTruthy()
    })
    it('Check whether the class has specific annotation when having multiple annotation', function () {
      var annotation = _x.createAnnotation()
      var annotation1 = _x.createAnnotation()
      var Person = _x.createCls(
        {
          annotations: [annotation, annotation1]
        }
      )
      expect(Person.isAnnotationPresent(annotation)).toBeTruthy()
      expect(Person.isAnnotationPresent(annotation1)).toBeTruthy()
    })
  })
  describe('Annotation contain properties', function () {
    it('Has property with defined value', function () {
      var annotation = _x.createAnnotation(
        {
          name: ''
        }
      )
      var Person = _x.createCls(
        {
          annotations: [annotation('superman')]
        }
      )
      expect(Person.getAnnotation().value() === 'superman').toBeTruthy()
    })
    it('Has property with default value', function () {
      var annotation = _x.createAnnotation(
        {
          name: 'hello'
        }
      )
      var Person = _x.createCls(
        {
          annotations: [annotation()]
        }
      )
      expect(Person.getAnnotation().value() === 'hello').toBeTruthy()
    })
  })
})
