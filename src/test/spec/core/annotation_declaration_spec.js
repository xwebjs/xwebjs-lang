describe('Declare annotation', function () {
  var spyBox
  beforeEach(function () {
    spyBox = jasmine.createSpyObj('', ['methodA', 'methodB', 'methodC', 'methodD'])
// eslint-disable-next-line no-undef
    jasmine.addMatchers(methodMetaMatchers)
  })
  describe('Declare annotation', function () {
    it('Declare annotation with one property', function () {
      var annotation = _x.createAnnotation({
        props: {
          name: 'superman'
        }
      })
      expect(annotation.getProperties()['name'].type === 'string').toBeTruthy()
      expect(annotation.getProperties()['name'].defaultValue === 'superman').toBeTruthy()

      var annotationInstance = annotation.valueOf()
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
      var annotationInstance = annotation.valueOf()
      expect(annotation.getProperties()['name'].type === 'string').toBeTruthy()
      expect(annotation.getProperties()['name'].defaultValue === 'superman').toBeTruthy()

      expect(annotation.getProperties()['age'].type === 'number').toBeTruthy()
      expect(annotation.getProperties()['age'].defaultValue === 19).toBeTruthy()
      expect(annotationInstance.age === 19).toBeTruthy()

      expect(annotation.getProperties()['isGood'].type === 'boolean').toBeTruthy()
      expect(annotation.getProperties()['isGood'].defaultValue === false).toBeTruthy()
      expect(annotationInstance.isGood === false).toBeTruthy()
    })
  })
  describe('Check the annotation on class', function () {
    it('Check whether the class has specific annotation when having only one annotation', function () {
      var annotation = _x.createAnnotation()
      var Person = _x.createCls(
        {
          annotations: [annotation.valueOf()]
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
          annotations: [annotation.valueOf(), annotation1.valueOf()]
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
          annotations: [annotation.valueOf({
            name: 'xman',
            age: 20,
            isGood: false
          })]
        }
      )
      expect(Person._meta.isAnnotationPresent(annotation)).toBeTruthy()
      expect(Person._meta.getAnnotationInstance(annotation).name === 'xman').toBeTruthy()
    })
  })
})
