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
  describe('Use annotation on the class', function () {
    it('Access the declared annotation through class meta with one referenced annotation', function () {
      var annotation = _x.createAnnotation()
      var Person = _x.createCls(
        {
          annotations: [annotation.valueOf()]
        }
      )
      expect(Person.class.isAnnotationPresent(annotation)).toBeTruthy()
    })
    it('Access the declared annotation through class meta without referenced annotation', function () {
      var annotation = _x.createAnnotation()
      var Person = _x.createCls(
        {
          annotations: []
        }
      )
      expect(!Person.class.isAnnotationPresent(annotation)).toBeTruthy()
    })
    it('Access the declared annotation through class meta with two referenced annotations', function () {
      var annotation = _x.createAnnotation()
      var annotation1 = _x.createAnnotation()
      var Person = _x.createCls(
        {
          annotations: [annotation.valueOf(), annotation1.valueOf()]
        }
      )
      expect(Person.class.isAnnotationPresent(annotation)).toBeTruthy()
      expect(Person.class.isAnnotationPresent(annotation1)).toBeTruthy()
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
      expect(Person.class.isAnnotationPresent(annotation)).toBeTruthy()
      expect(Person.class.getAnnotationInstance(annotation).name === 'xman').toBeTruthy()
    })
  })
  describe('Use annotation on the class instance method', function () {
    it('Access the declared annotation through class method meta', function () {
      var annotation = _x.createAnnotation()
      var Person = _x.createCls(
        {
          methods: [
            {
              name: 'speak',
              annotations: [annotation.valueOf()],
              method: function () {
                spyBox.methodA()
              }
            }
          ]
        }
      )
      var person = new Person()
      expect(person.getXClass().getInstanceMethod('speak').isAnnotationPresent(annotation)).toBeTruthy()
    })
    it('Access the default value of annotation instance', function () {
      var annotation = _x.createAnnotation({
        props: {
          name: 'superman',
          age: 19,
          isGood: false
        }
      })
      var Person = _x.createCls(
        {
          methods: [
            {
              name: 'speak',
              annotations: [annotation.valueOf()],
              method: function () {
                spyBox.methodA()
              }
            }
          ]
        }
      )
      var person = new Person()
      expect(person.getXClass().getInstanceMethod('speak').isAnnotationPresent(annotation)).toBeTruthy()
      expect(person.getXClass().getInstanceMethod('speak').getAnnotationInstance(annotation).name === 'superman').toBeTruthy()
      expect(person.getXClass().getInstanceMethod('speak').getAnnotationInstance(annotation).age === 19).toBeTruthy()
      expect(person.getXClass().getInstanceMethod('speak').getAnnotationInstance(annotation).isGood === false).toBeTruthy()
    })
    it('Access the assigned value of annotation instance', function () {
      var annotation = _x.createAnnotation({
        props: {
          name: 'superman',
          age: 19,
          isGood: false
        }
      })
      var Person = _x.createCls(
        {
          methods: [
            {
              name: 'speak',
              annotations: [annotation.valueOf(
                {
                  name: 'xman',
                  age: 20,
                  isGood: false
                })
              ],
              method: function () {
                spyBox.methodA()
              }
            }
          ]
        }
      )
      var person = new Person()
      expect(person.getXClass().getInstanceMethod('speak').isAnnotationPresent(annotation)).toBeTruthy()
      expect(person.getXClass().getInstanceMethod('speak').getAnnotationInstance(annotation).name === 'xman').toBeTruthy()
      expect(person.getXClass().getInstanceMethod('speak').getAnnotationInstance(annotation).age === 20).toBeTruthy()
      expect(person.getXClass().getInstanceMethod('speak').getAnnotationInstance(annotation).isGood === false).toBeTruthy()
    })
  })
  describe('Use annotation on the class static method', function () {
    it('Access the declared annotation through the meta data', function () {
      var annotation = _x.createAnnotation()
      var Person = _x.createCls(
        {
          staticMethods: [
            {
              name: 'speak',
              annotations: [annotation.valueOf()],
              method: function () {
                spyBox.methodA()
              }
            }
          ]
        }
      )
      expect(Person.class.getStaticMethod('speak').isAnnotationPresent(annotation)).toBeTruthy()
    })
    it('Access the default value of annotation instance', function () {
      var annotation = _x.createAnnotation({
        props: {
          name: 'superman',
          age: 19,
          isGood: false
        }
      })
      var Person = _x.createCls(
        {
          staticMethods: [
            {
              name: 'speak',
              annotations: [annotation.valueOf()],
              method: function () {
                spyBox.methodA()
              }
            }
          ]
        }
      )
      expect(Person.class.getStaticMethod('speak').isAnnotationPresent(annotation)).toBeTruthy()
      expect(Person.class.getStaticMethod('speak').getAnnotationInstance(annotation).name === 'superman').toBeTruthy()
      expect(Person.class.getStaticMethod('speak').getAnnotationInstance(annotation).age === 19).toBeTruthy()
      expect(Person.class.getStaticMethod('speak').getAnnotationInstance(annotation).isGood === false).toBeTruthy()
    })
    it('Access the assigned value of annotation instance', function () {
      var annotation = _x.createAnnotation({
        props: {
          name: 'superman',
          age: 19,
          isGood: false
        }
      })
      var Person = _x.createCls(
        {
          staticMethods: [
            {
              name: 'speak',
              annotations: [annotation.valueOf(
                {
                  name: 'xman',
                  age: 20,
                  isGood: false
                })
              ],
              method: function (msg) {
                spyBox.methodA()
              },
              params: [
                {
                  type: 'string'
                }
              ]
            }
          ]
        }
      )
      expect(Person.class.getStaticMethod('speak', 'hello').isAnnotationPresent(annotation)).toBeTruthy()
      expect(Person.class.getStaticMethod('speak', 'hello').getAnnotationInstance(annotation).name === 'xman').toBeTruthy()
      expect(Person.class.getStaticMethod('speak', 'hello').getAnnotationInstance(annotation).age === 20).toBeTruthy()
      expect(Person.class.getStaticMethod('speak', 'hello').getAnnotationInstance(annotation).isGood === false).toBeTruthy()

      function call (msg) {
        expect(Person.class.getStaticMethod('speak', arguments).isAnnotationPresent(annotation)).toBeTruthy()
      }

      call('hello')
    })
  })
  describe('Use annotation on the class instance property', function () {
    it('Access the declared annotation through the meta data', function () {
      var annotation = _x.createAnnotation()
      var Person = _x.createCls(
        {
          props: {
            name: {
              _xConfig: true,
              annotations: [annotation.valueOf()],
              defaultValue: 'superman'
            }
          }
        }
      )
      var person = new Person()
      expect(person.getXClass().getInstanceProperty('name').isAnnotationPresent(annotation)).toBeTruthy()
    })
    it('Access the default value of annotation instance', function () {
      var annotation = _x.createAnnotation({
        props: {
          name: 'superman',
          age: 19,
          isGood: false
        }
      })
      var Person = _x.createCls(
        {
          props: {
            name: {
              _xConfig: true,
              annotations: [annotation.valueOf()],
              defaultValue: 'superman'
            }
          }
        }
      )
      var person = new Person()
      expect(person.getXClass().getInstanceProperty('name').isAnnotationPresent(annotation)).toBeTruthy()
      expect(person.getXClass().getInstanceProperty('name').getAnnotationInstance(annotation).name === 'superman').toBeTruthy()
      expect(person.getXClass().getInstanceProperty('name').getAnnotationInstance(annotation).age === 19).toBeTruthy()
      expect(person.getXClass().getInstanceProperty('name').getAnnotationInstance(annotation).isGood === false).toBeTruthy()
    })
    it('Access the assigned value of annotation instance', function () {
      var annotation = _x.createAnnotation({
        props: {
          name: 'superman',
          age: 19,
          isGood: false
        }
      })
      var Person = _x.createCls(
        {
          props: {
            name: {
              _xConfig: true,
              annotations: [annotation.valueOf(
                {
                  name: 'xman',
                  age: 20
                }
              )],
              defaultValue: 'superman'
            }
          }
        }
      )
      var person = new Person()
      expect(person.getXClass().getInstanceProperty('name').isAnnotationPresent(annotation)).toBeTruthy()
      expect(person.getXClass().getInstanceProperty('name').getAnnotationInstance(annotation).name === 'xman').toBeTruthy()
      expect(person.getXClass().getInstanceProperty('name').getAnnotationInstance(annotation).age === 20).toBeTruthy()
      expect(person.getXClass().getInstanceProperty('name').getAnnotationInstance(annotation).isGood === false).toBeTruthy()
    })
  })
  describe('Use annotation on the class static properties', function () {
    it('Access the declared annotation through the meta data', function () {
      var annotation = _x.createAnnotation()
      var Person = _x.createCls(
        {
          staticProps: [
            {
              name: 'name',
              annotations: [annotation.valueOf()]
            }
          ]
        }
      )
      expect(Person.class.getStaticProperty('name').isAnnotationPresent(annotation)).toBeTruthy()
    })
    it('Access the default value of annotation instance', function () {
      var annotation = _x.createAnnotation({
        props: {
          name: 'superman',
          age: 19,
          isGood: false
        }
      })
      var Person = _x.createCls(
        {
          staticProps: [
            {
              name: 'name',
              annotations: [annotation.valueOf()]
            }
          ]
        }
      )
      expect(Person.class.getStaticProperty('name').isAnnotationPresent(annotation)).toBeTruthy()
      expect(Person.class.getStaticProperty('name').getAnnotationInstance(annotation).name === 'superman').toBeTruthy()
      expect(Person.class.getStaticProperty('name').getAnnotationInstance(annotation).age === 19).toBeTruthy()
      expect(Person.class.getStaticProperty('name').getAnnotationInstance(annotation).isGood === false).toBeTruthy()
    })
    it('Access the assigned value of annotation instance', function () {
      var annotation = _x.createAnnotation({
        props: {
          name: 'superman',
          age: 19,
          isGood: false
        }
      })
      var Person = _x.createCls(
        {
          staticProps: [
            {
              name: 'name',
              annotations: [annotation.valueOf(
                {
                  name: 'xman',
                  age: 20,
                  isGood: false
                })
              ]
            }
          ]
        }
      )
      expect(Person.class.getStaticProperty('name').isAnnotationPresent(annotation)).toBeTruthy()
      expect(Person.class.getStaticProperty('name').getAnnotationInstance(annotation).name === 'xman').toBeTruthy()
      expect(Person.class.getStaticProperty('name').getAnnotationInstance(annotation).age === 20).toBeTruthy()
      expect(Person.class.getStaticProperty('name').getAnnotationInstance(annotation).isGood === false).toBeTruthy()
    })
  })
  describe('Use annotation on the method parameter', function () {
    it('Access the declared annotation through the meta data', function () {
      var annotation = _x.createAnnotation()
      var Person = _x.createCls(
        {
          methods: [
            {
              name: 'speak',
              method: function (msg) {
              },
              params: [
                {
                  type: 'string',
                  annotations: [
                    annotation.valueOf()
                  ]
                }
              ]
            }
          ]
        }
      )
      var person = new Person()
      expect(person.getXClass().getInstanceMethod('speak', 'hello').getParams()[0].isAnnotationPresent(annotation)).toBeTruthy()
    })
  })
})
