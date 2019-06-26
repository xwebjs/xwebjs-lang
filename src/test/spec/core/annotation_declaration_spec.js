describe('Declare annotation', function () {
  var spyBox
  beforeEach(function () {
    spyBox = jasmine.createSpyObj('', ['methodA', 'methodB', 'methodC', 'methodD'])
// eslint-disable-next-line no-undef
    jasmine.addMatchers(methodMetaMatchers)
  })
  describe('Declare annotation', function () {
    it('Simple annotation', function () {
      var annotation = _x.createAnnotation()
      expect(_x.isAnnotation(annotation)).toBeTruthy()
    })
    it('Declare annotation with one property', function () {
      var annotation = _x.createAnnotation({
        props: {
          name: 'superman'
        }
      })
      expect(_x.isAnnotation(annotation)).toBeTruthy()
      expect(annotation._meta.props.name.name === 'name').toBeTruthy()
      expect(annotation._meta.props.name.type === 'string').toBeTruthy()
      expect(annotation._meta.props.name.defaultValue === 'superman').toBeTruthy()
      var annotationInstance = annotation()
      expect(annotationInstance.name === 'superman').toBeTruthy()
    })
    it('Declare annotation with multiple properties', function () {
      var annotation = _x.createAnnotation({
        props: {
          name: 'superman',
          age: 19,
          isGood: false
        }
      })
      expect(_x.isAnnotation(annotation)).toBeTruthy()
      var annotationInstance = annotation()
      expect(annotation._meta.props.name.name === 'name').toBeTruthy()
      expect(annotation._meta.props.name.type === 'string').toBeTruthy()
      expect(annotation._meta.props.name.defaultValue === 'superman').toBeTruthy()
      expect(annotationInstance.name === 'superman').toBeTruthy()

      expect(annotation._meta.props.age.name === 'age').toBeTruthy()
      expect(annotation._meta.props.age.type === 'number').toBeTruthy()
      expect(annotation._meta.props.age.defaultValue === 19).toBeTruthy()
      expect(annotationInstance.age === 19).toBeTruthy()

      expect(annotation._meta.props.isGood.name === 'isGood').toBeTruthy()
      expect(annotation._meta.props.isGood.type === 'boolean').toBeTruthy()
      expect(annotation._meta.props.isGood.defaultValue === false).toBeTruthy()
      expect(annotationInstance.isGood === false).toBeTruthy()
    })
  })
  describe('Check the annotation on class', function () {
    it('Check whether the class has specific annotation when having only one annotation', function () {
      var annotation = _x.createAnnotation()
      var Person = _x.createCls(
        {
          annotations: [annotation.inst()]
        }
      )
      expect(Person._meta.isAnnotationPresent(annotation)).toBeTruthy()
    })
    it('Check whether the class has specific annotation when having no annotation', function () {
      var annotation = _x.createAnnotation()
      var Person = _x.createCls(
        {
          annotations: []
        }
      )
      expect(!Person._meta.isAnnotationPresent(annotation)).toBeTruthy()
    })
    it('Check whether the class has specific annotation when having multiple annotation', function () {
      var annotation = _x.createAnnotation()
      var annotation1 = _x.createAnnotation()
      var Person = _x.createCls(
        {
          annotations: [annotation.inst(), annotation1.inst()]
        }
      )
      expect(Person._meta.isAnnotationPresent(annotation)).toBeTruthy()
      expect(Person._meta.isAnnotationPresent(annotation1)).toBeTruthy()
    })
    it('Assign the value for annotation instance', function () {
      var annotation = _x.createAnnotation({
        props: {
          name: 'superman',
          age: 19,
          isGood: false
        }
      })
      var Person = _x.createCls(
        {
          annotations: [annotation.inst({
            name: 'xman',
            age: 20,
            isGood: false
          })]
        }
      )
      expect(!Person._meta.isAnnotationPresent(annotation)).toBeTruthy()
      expect(Person._meta.getAnnotationInstance(annotation).name === 'xman').toBeTruthy()
    })
  })
})
