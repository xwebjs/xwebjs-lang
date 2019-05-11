// Object matcher
describe('Declare class', function () {
  // @Given
  var EmptyCustomType = _x.createCls({
    props: {
      id: 'customId'
    }
  })
  var emptyCustomTypeInstance = new EmptyCustomType()
  var spyBox
  var sharedMethodsInfoForTestingOverload = [
    {
      method: function () {
        spyBox.methodA.apply(this, arguments)
      }
    },
    {
      method: function (a) {
        spyBox.methodB.apply(this, arguments)
      },
      params: [
        {
          type: 'string'
        }
      ]
    },
    {
      method: function (a, b) {
        spyBox.methodC.apply(this, arguments)
      },
      params: [
        {
          type: 'string'
        },
        {
          type: 'number'
        }
      ]
    },
    {
      method: function (a, b, c) {
        spyBox.methodD.apply(this, arguments)
      },
      params: [
        {
          type: 'string'
        },
        {
          type: 'number'
        },
        {
          type: EmptyCustomType
        }
      ]
    }
  ]
  beforeEach(function () {
    spyBox = jasmine.createSpyObj('', ['methodA', 'methodB', 'methodC', 'methodD'])
// eslint-disable-next-line no-undef
    jasmine.addMatchers(objectMatcher)
  })
  describe('Pure class declaration', function () {
    it('Pass undefined info', function () {
      // @when the user create empty person class without arguments
      var Person = _x.createCls()

      // @and the person instance is created through 'new' operator
      var person = new Person()

      // @then person should be instance of class Person
      expect(person).isTypeOf(Person)
    })
    it('Pass empty object', function () {
      // @when the user create empty person class with empty object
      var Person = _x.createCls({})

      // @and the person instance is created through 'new' operator
      var person = new Person()

      // @then person should be instance of class Person
      expect(person).isTypeOf(Person)
    })
  })
  describe('Declare constructor', function () {
    var calledByConstructor
    beforeEach(function () {
      calledByConstructor = jasmine.createSpy('')
    })
    it('Single constructor function without parameter', function () {
      // @when
      var Person = _x.createCls(
        {
          construct: function () {
            calledByConstructor.apply(this, arguments)
          }
        })
      /* eslint-disable no-unused-vars */
      // @and
      var person = new Person()
      // @then constructor function should have been called
      expect(calledByConstructor).toBeTruthy()
    })
    it('Single constructor function with parameters', function () {
      // @when
      var Person = _x.createCls(
        {
          construct: function (parama, paramb) {
            calledByConstructor.apply(this, arguments)
          }
        })
      /* eslint-disable no-unused-vars */
      // @and
      var person = new Person('a', 'b')
      // @then constructor function should have been called
      expect(calledByConstructor).toHaveBeenCalledWith('a', 'b')
    })
    describe('Overload constructor', function () {
      it('Methods have different parameter length', function () {
        // @when
        var Person = _x.createCls(
          {
            construct: [
              function () {
                spyBox.methodA.apply(this, arguments)
              },
              function (a) {
                spyBox.methodB.apply(this, arguments)
              },
              function (a, b) {
                spyBox.methodC.apply(this, arguments)
              }
            ]
          }
        )
        // @and
        var person = new Person()
        // @then
        expect(spyBox.methodA).toHaveBeenCalled()
        // @when
        person = new Person('a')
        // @then
        expect(spyBox.methodB).toHaveBeenCalledWith('a')
        // @when
        person = new Person('a', 'b')
        // @then
        expect(spyBox.methodC).toHaveBeenCalledWith('a', 'b')
      })

      it('Methods have different parameter type', function () {
        // @when
        var Person = _x.createCls(
          {
            construct: sharedMethodsInfoForTestingOverload
          }
        )
        // @and
        var person = new Person()
        // @then
        expect(spyBox.methodA).toHaveBeenCalled()
        // @when
        person = new Person('a')
        // @then
        expect(spyBox.methodB).toHaveBeenCalledWith('a')
        // @when
        person = new Person('a', 13)
        // @then
        expect(spyBox.methodC).toHaveBeenCalledWith('a', 13)
        // @when
        person = new Person('a', 13, emptyCustomTypeInstance)
        // @then
        expect(spyBox.methodD).toHaveBeenCalledWith('a', 13, emptyCustomTypeInstance)
      })
    })
  })
  describe('Declare properties', function () {
    var nameValue = 'Nick'
    var ageValue = 13
    var hobbiesValue = ['game', 'sport']
    var toolValue = emptyCustomTypeInstance
    var houseValue
    var emptyObjectValue = {}
    var carValue = null
    var isReadyValue = true
    var isRunningValue = false
    var playValue = function () {}
    var defaultPropInfo = {
      name: nameValue,
      age: ageValue,
      emptyObjectValue: emptyObjectValue,
      hobbies: hobbiesValue,
      tool: toolValue,
      house: houseValue,
      car: carValue,
      isReady: isReadyValue,
      isRunning: isRunningValue,
      /* It is not allowed to pass function */
      play: function () {
      }
    }
    var defaultPropInfoWithKey = {
      name: {
        __xConfig: true,
        defaultValue: nameValue
      },
      age: {
        __xConfig: true,
        defaultValue: ageValue
      },
      emptyObjectValue: {
        __xConfig: true,
        defaultValue: emptyObjectValue
      },
      hobbies: {
        __xConfig: true,
        defaultValue: hobbiesValue
      },
      tool: {
        __xConfig: true,
        defaultValue: toolValue
      },
      house: {
        __xConfig: true,
        defaultValue: houseValue
      },
      car: {
        __xConfig: true,
        defaultValue: carValue
      },
      isReady: {
        __xConfig: true,
        defaultValue: isReadyValue
      },
      isRunning: {
        __xConfig: true,
        defaultValue: isRunningValue
      },
      play: {
        __xConfig: true,
        defaultValue: playValue
      }
    }
    var keyValueProperties = {
      name: undefined,
      age: 13
    }
    var arrayProperties = ['name', 'age']
    var arrayDefaultPropInfo = [
      {
        name: 'name',
        defaultValue: nameValue
      },
      {
        name: 'age',
        defaultValue: ageValue
      },
      {
        name: 'hobbies',
        defaultValue: hobbiesValue
      },
      {
        name: 'emptyObjectValue',
        defaultValue: emptyObjectValue
      },
      {
        name: 'tool',
        defaultValue: toolValue
      },
      {
        name: 'car',
        defaultValue: carValue
      },
      {
        name: 'house',
        defaultValue: houseValue
      },
      {
        name: 'isReady',
        defaultValue: isReadyValue
      },
      {
        name: 'isRunning',
        defaultValue: isRunningValue
      },
      {
        name: 'play',
        defaultValue: playValue
      }
    ]
    describe('Declare instance properties', function () {
      it('Passing empty properties', function () {
        // @when
        var Person = _x.createCls({props: {}})
        // @and
        var person = new Person()
        // @then
        expect(person).isTypeOf(Person)
        // @when
        Person = _x.createCls({props: undefined})
        // @and
        person = new Person()
        // @then
        expect(person).isTypeOf(Person)
      })
      it('Using object key style', function () {
        // @when
        var Person = _x.createCls({
          props: keyValueProperties
        })
        // @and
        var person = new Person()
        // @then
        expect(
          person.hasOwnProperty('name') &&
          person.hasOwnProperty('age')
        ).toBeTruthy()
      })
      it('Using array style', function () {
        // @when
        var Person = _x.createCls(
          {
            props: arrayProperties
          }
        )
        // @and
        var person = new Person()
        // @then
        expect(
          person.hasOwnProperty('name') &&
          person.hasOwnProperty('age')
        ).toBeTruthy()
      })
      describe('Assign default value for instance properties', function () {
        var compareInstanceDefaultValue = function (person) {
          _.each(defaultPropInfo, function (value, key, obj) {
            if (key === 'house') {
              expect(person.hasOwnProperty(key)).toBeTruthy()
            } else if (key === 'emptyObjectValue') {
              expect(
                _.isObject(person[key]) && _.isEmpty(person[key]) && emptyObjectValue !== person[key]
              ).toBeTruthy()
            } else if (key === 'play') {
              expect(
                person[key]
              ).toBeUndefined()
            } else if (key === 'tool') {
              expect(
                person[key].id === emptyCustomTypeInstance.id
              ).toBeTruthy()
              expect(person.hasOwnProperty(key)).toBeTruthy()
            } else {
              expect(person[key]).toEqual(value)
              expect(person.hasOwnProperty(key)).toBeTruthy()
            }
          }, this)
        }
        it('Using object key value style', function () {
          // @when
          var Person = _x.createCls({
            props: defaultPropInfo
          })
          // @and
          var person = new Person()

          // @then
          compareInstanceDefaultValue.call(this, person)
        })
        it('Using object key value style with name', function () {
          // @when
          var Person = _x.createCls({
            props: defaultPropInfoWithKey
          })
          // @and
          var person = new Person()

          // @then
          compareInstanceDefaultValue.call(this, person)
        })
        it('Using array value style', function () {
          // @when
          var Person = _x.createCls({
            props: arrayDefaultPropInfo
          })
          // @and
          var person = new Person()

          // @then
          compareInstanceDefaultValue.call(this, person)
        })
        it('Use "shared" attribute to reinforce sharing for primitive object', function () {
          // @when
          var Person = _x.createCls({
            props: {
              map: {
                __xConfig: true,
                shared: true,
                defaultValue: emptyObjectValue
              }
            }
          })
          // @and
          var person = new Person()
          // @then
          expect(person.map === emptyObjectValue).toBeTruthy()
        })
        it('Use "shared" attribute to explicitly disable sharing for primitive object', function () {
          // @when
          var Person = _x.createCls(
            {
              props: {
                map: {
                  __xConfig: true,
                  shared: false,
                  defaultValue: emptyObjectValue
                }
              }
            }
          )
          // @and
          var person = new Person()
          // @then
          expect(person.map !== emptyObjectValue).toBeTruthy()
        })
      })
      describe('Value assignment type check', function () {
        var Person
        var person
        var Style
        var IfStyle
        beforeEach(function () {
          IfStyle = _x.createIf()
          Style = _x.createCls()
          Person = _x.createCls({
            props: {
              stringValue: {
                __xConfig: true,
                type: 'string'
              },
              booleanValue: {
                __xConfig: true,
                type: 'boolean'
              },
              numberValue: {
                __xConfig: true,
                type: 'number'
              },
              functionValue: {
                __xConfig: true,
                type: 'function'
              },
              objectValue: {
                __xConfig: true,
                type: 'object'
              },
              classValue: {
                __xConfig: true,
                type: Style
              },
              interfaceValue: {
                __xConfig: true,
                type: IfStyle
              }
            }
          })
          person = Person.newInstance()
        })
        it('Primitive string value property check', function () {
          try {
            person.stringValue = 33
            fail('Expect to throw Exception')
          } catch (e) {
            expect(e.message.toLowerCase()).toContain('property "stringValue" is invalid'.toLowerCase())
            expect(e.message.toLowerCase()).toContain('the assigned value type is: "number" but the expected type is "string"'.toLowerCase())
          }
          try {
            person.stringValue = '33'
            expect(true).toBeTruthy()
          } catch (e) {
            fail('Unexpected exception ' + e.message)
          }
        })
        it('Primitive number value property check', function () {
          try {
            person.numberValue = '33'
            fail('Expect to throw Exception')
          } catch (e) {
            expect(e.message.toLowerCase()).toContain('property "numberValue" is invalid'.toLowerCase())
            expect(e.message.toLowerCase()).toContain('the assigned value type is: "string" but the expected type is "number"'.toLowerCase())
          }
          try {
            person.numberValue = 33
            expect(true).toBeTruthy()
          } catch (e) {
            fail('Unexpected exception ' + e.message)
          }
        })
        it('Boolean value property check', function () {
          try {
            person.booleanValue = '33'
            fail('Expect to throw Exception')
          } catch (e) {
            expect(e.message.toLowerCase()).toContain('property "booleanValue" is invalid'.toLowerCase())
            expect(e.message.toLowerCase()).toContain('the assigned value type is: "string" but the expected type is "boolean"'.toLowerCase())
          }
          try {
            person.booleanValue = true
            expect(true).toBeTruthy()
          } catch (e) {
            fail('Unexpected exception ' + e.message)
          }
        })
        it('Primitive function value property check', function () {
          try {
            person.functionValue = '33'
            fail('Expect to throw Exception')
          } catch (e) {
            expect(e.message.toLowerCase()).toContain('property "functionValue" is invalid'.toLowerCase())
          }
          try {
            person.functionValue = function () {}
            expect(true).toBeTruthy()
          } catch (e) {
            fail('Unexpected exception ' + e.message)
          }
        })
        it('Primitive object value property check', function () {
          try {
            person.objectValue = function () {}
            fail('Expect to throw Exception')
          } catch (e) {
            expect(e.message.toLowerCase()).toContain('property "objectValue" is invalid'.toLowerCase())
            expect(e.message.toLowerCase()).toContain('the assigned value type is: "function" but the expected type is "object"'.toLowerCase())
          }
          try {
            person.objectValue = Style.newInstance()
            fail('Expect to throw Exception')
          } catch (e) {
            expect(e.message.toLowerCase()).toContain('property "objectValue" is invalid'.toLowerCase())
            expect(e.message.toLowerCase()).toContain('the assigned value type is: "class" but the expected type is "object"'.toLowerCase())
          }
          try {
            person.objectValue = {}
            expect(true).toBeTruthy()
          } catch (e) {
            fail('Unexpected exception ' + e.message)
          }
        })
        it('Class value property check', function () {
          try {
            person.classValue = function () {}
            fail('Expect to throw Exception')
          } catch (e) {
            expect(e.message.toLowerCase()).toContain('property "classValue" is invalid'.toLowerCase())
          }
          try {
            person.classValue = _x.createCls().newInstance()
            fail('Expect to throw Exception')
          } catch (e) {
            expect(e.message.toLowerCase()).toContain('property "classValue" is invalid'.toLowerCase())
            expect(e.message.toLowerCase()).toContain('the assigned class instance is not the expected type of Class'.toLowerCase())
          }
          try {
            person.classValue = Style.newInstance()
            expect(true).toBeTruthy()
          } catch (e) {
            fail('Unexpected exception ' + e.message)
          }
        })
        it('Interface value property check', function () {
          try {
            person.interfaceValue = function () {}
            fail('Expect to throw Exception')
          } catch (e) {
            expect(e.message.toLowerCase()).toContain('property "interfaceValue" is invalid'.toLowerCase())
          }
          try {
            person.interfaceValue = Style.newInstance()
            fail('Expect to throw Exception')
          } catch (e) {
            expect(e.message.toLowerCase()).toContain('property "interfaceValue" is invalid'.toLowerCase())
            expect(e.message.toLowerCase()).toContain('the assigned class instance does not implement the expected interface type'.toLowerCase())
          }
          try {
            var exStyle = _x.createCls(
              {
                implements: [
                  IfStyle
                ]
              }
            )
            person.interfaceValue = exStyle.newInstance()
            expect(true).toBeTruthy()
          } catch (e) {
            fail('Unexpected exception ' + e.message)
          }
        })
      })
    })
    describe('Declare static properties', function () {
      it('empty static properties', function () {
        var person
        // @when
        var Person = _x.createCls({
          staticProps: {}
        })
        person = new Person()
        // @then
        expect(person).isTypeOf(Person)

        // @when
        Person = _x.createCls({
          staticProps: undefined
        })
        person = new Person()
        // @then
        expect(person).isTypeOf(Person)
      })
      it('Using object key style', function () {
        // @when
        var Person = _x.createCls({
          staticProps: keyValueProperties
        })
        // @then
        expect(
          Person._statics.hasOwnProperty('name') && Person.getStaticValue('name') === undefined &&
          Person._statics.hasOwnProperty('age') && Person.getStaticValue('age') === 13
        ).toBeTruthy()
      })
      it('Using array style', function () {
        // @when
        var Person = _x.createCls(
          {
            staticProps: arrayProperties
          }
        )
        // @then
        expect(
          Person._statics.hasOwnProperty('name') && Person.getStaticValue('name') === undefined &&
          Person._statics.hasOwnProperty('age') && Person.getStaticValue('age') === undefined
        ).toBeTruthy()
      })
      describe('Assign default value for static properties', function () {
        var compareStaticDefaultValue = function (Person) {
          _.each(defaultPropInfo, function (value, key, obj) {
            if (key === 'house') {
              expect(Person._statics.hasOwnProperty(key) && Person.getStaticValue(key) === undefined).toBeTruthy()
            } else if (key === 'emptyObjectValue') {
              expect(
                _.isObject(Person._statics[key]) && _.isEmpty(Person._statics[key])
              ).toBeTruthy()
            } else if (key === 'play') {
              expect(Person._statics[key]).toBeUndefined()
            } else if (key === 'tool') {
              expect(
                Person._statics.hasOwnProperty(key) && Person.getStaticValue(key) === emptyCustomTypeInstance
              ).toBeTruthy()
            } else {
              expect(Person.getStaticValue(key)).toEqual(value)
            }
          }, this)
        }
        it('Using object key value style', function () {
          // @when
          var Person = _x.createCls({
            staticProps: defaultPropInfo
          })
          // @then
          compareStaticDefaultValue.call(this, Person)
        })
        it('Using object key value style with name', function () {
          // @when
          var Person = _x.createCls({
            staticProps: defaultPropInfoWithKey
          })
          // @then
          compareStaticDefaultValue.call(this, Person)
        })
        it('Using array value style', function () {
          // @when
          var Person = _x.createCls({
            staticProps: arrayDefaultPropInfo
          })
          // @then
          compareStaticDefaultValue.call(this, Person)
        })
      })
      describe('Set static value', function () {
        it('Use normal method', function () {
          var Person = _x.createCls({
            staticProps: {
              name: null
            }
          })
          Person.setStaticValue('name', 'mike')
          expect(Person._statics['name'] === 'mike').toBeTruthy()
        })
        it('Use shortcut self method', function () {
          var Person = _x.createCls({
            staticProps: {
              name: null
            }
          })
          Person.$.name = 'jane'
          expect(Person._statics['name'] === 'jane').toBeTruthy()
        })
      })
      describe('Get static value', function () {
        it('Use normal method', function () {
          var Person = _x.createCls({
            staticProps: {
              name: 'mike'
            }
          })
          expect(Person.getStaticValue('name') === 'mike').toBeTruthy()
        })
        it('Use shortcut $', function () {
          var Person = _x.createCls({
            staticProps: {
              name: 'mike'
            }
          })
          expect(Person.$.name === 'mike').toBeTruthy()
        })
        it('Use shortcut $ inside instance method', function () {
          var speakedName
          var Person = _x.createCls({
            staticProps: {
              name: 'mike'
            },
            methods: {
              speakName: function () {
                speakedName = this.$.name
              }
            }
          })
          var person = new Person()
          person.speakName()
          expect(speakedName === 'mike').toBeTruthy()
        })
      })
    })
  })
  describe('Declare methods', function () {
    var methodInfoWithObjectkeyStyle = {
      speak: function () {
        spyBox.methodA.apply(this, arguments)
      }
    }
    var methodInfoWithArrayStyle = [
      function speak () {
        spyBox.methodA.apply(this, arguments)
      }
    ]
    describe('Declare instance methods', function () {
      it('Using object key style', function () {
        // @when
        var Person = _x.createCls(
          {
            methods: methodInfoWithObjectkeyStyle
          }
        )
        // @and
        var person = new Person()
        person.speak()
        // @ Then
        expect('speak').isMethodOf(person)
        expect(spyBox.methodA).toHaveBeenCalled()
      })
      it('Using array style', function () {
        // @when
        var Person = _x.createCls(
          {
            methods: methodInfoWithArrayStyle
          }
        )
        // @and
        var person = new Person()
        person.speak()
        // @ Then
        expect('speak').isMethodOf(person)
        expect(spyBox.methodA).toHaveBeenCalled()
      })
      describe('Overload instance method', function () {
        it('methods with different parameter length', function () {
          // @when
          var Person = _x.createCls(
            {
              methods: [
                function a () {
                  spyBox.methodA.apply(this, arguments)
                },
                function a (a) {
                  spyBox.methodB.apply(this, arguments)
                },
                function a (a, b) {
                  spyBox.methodC.apply(this, arguments)
                },
                function c () {
                  spyBox.methodD.apply(this, arguments)
                }
              ]
            }
          )
          // @and
          var person = new Person()
          // @ Then
          person.a()
          expect(spyBox.methodA).toHaveBeenCalled()
          person.a('a')
          expect(spyBox.methodB).toHaveBeenCalled()
          person.a('a', 'b')
          expect(spyBox.methodC).toHaveBeenCalled()
          person.c()
          expect(spyBox.methodD).toHaveBeenCalled()
        })
        it('methods with different parameter type', function () {
          var info = []
          _.each(sharedMethodsInfoForTestingOverload, function (methodInfo, index, list) {
            info.push(
              _.extend(
                methodInfo,
                {
                  name: 'speak'
                }
              )
            )
          }, this)
          // @when
          var Person = _x.createCls(
            {
              methods: info
            }
          )
          // @and
          var person = new Person()
          // @when
          person.speak()
          // @then
          expect(spyBox.methodA).toHaveBeenCalledTimes(1)
          // @when
          person.speak('a')
          // @then
          expect(spyBox.methodB).toHaveBeenCalledTimes(1)
          expect(spyBox.methodB).toHaveBeenCalledWith('a')
          // @when
          person.speak('a', 13)
          // @then
          expect(spyBox.methodC).toHaveBeenCalledWith('a', 13)
          // @when
          person.speak('a', 13, emptyCustomTypeInstance)
          // @then
          expect(spyBox.methodD).toHaveBeenCalledWith('a', 13, emptyCustomTypeInstance)
        })
        it('methods with the same name are declared in array type', function () {
          var Person = _x.createCls(
            {
              methods: {
                speak: [
                  function (name) {
                    spyBox.methodA.apply(this, arguments)
                  },
                  function (name, words) {
                    spyBox.methodB.apply(this, arguments)
                  }
                ]
              }
            }
          )
          var person = new Person()
          person.speak('nick')
          expect(spyBox.methodA).toHaveBeenCalledWith('nick')

          person.speak('nick', 'come on')
          expect(spyBox.methodB).toHaveBeenCalledWith('nick', 'come on')
        })
      })
    })
    describe('Declare static methods', function () {
      it('Using object key style', function () {
        // @when
        var Person = _x.createCls(
          {
            staticMethods: methodInfoWithObjectkeyStyle
          }
        )
        // @when
        Person.speak()
        // @then
        expect(spyBox.methodA).toHaveBeenCalled()
      })
      it('Using array style', function () {
        // @when
        var Person = _x.createCls(
          {
            staticMethods: methodInfoWithArrayStyle
          }
        )
        Person.speak()
        // @then
        expect(spyBox.methodA).toHaveBeenCalled()
      })
    })
  })
  describe('Declare parent class', function () {
    it('inherit property with default value from parent class', function () {
      // @ Given
      // @ Given
      var Creature = _x.createCls(
        {
          props: {
            id: null,
            isLife: true
          }
        }
      )
      var Person = _x.createCls(
        {
          props: {
            preference: {
              __xConfig: true,
              defaultValue: 'good'
            },
            name: 'Wang',
            tool: emptyCustomTypeInstance,
            hobbies: ['a', 'b'],
            isDone: true,
            isReady: false
          }
        },
        Creature
      )

      var Employee = _x.createCls(
        {
          props: {
            name: 'Jeff',
            age: 14
          }
        }, Person
      )

      // @then
      var employee = new Employee()

      // @expectation
      expect(employee.preference === 'good').toBeTruthy()
      expect(employee.name === 'Jeff').toBeTruthy()
      expect(employee.age === 14).toBeTruthy()
      expect(employee.tool !== emptyCustomTypeInstance).toBeTruthy()
      expect(employee.hobbies).toEqual(['a', 'b'])
      expect(employee.isDone).toBeTruthy()
      expect(employee.isReady).toBeFalsy()
      expect(employee.id).toBeNull()
      expect(employee.isLife).toBeTruthy()
    })
    it('inherit methods from parent classes', function () {
      // @given
      var Shape = _x.createCls(
        {
          methods: [
            function draw () {
              spyBox.methodA()
            }
          ]
        }
      )
      var Circle = _x.createCls(
        {
          methods: [
            function drawCircle () {
              spyBox.methodB()
            }
          ]
        },
        Shape
      )
      var MagicCircle = _x.createCls(
        {
          methods: [
            function jump () {
              spyBox.methodC.apply(this, arguments)
            }
          ]
        },
        Circle
      )

      var circle = new MagicCircle()
      circle.draw()
      circle.drawCircle()
      circle.jump()
      // @expectation
      expect(spyBox.methodA).toHaveBeenCalled()
      expect(spyBox.methodB).toHaveBeenCalled()
      expect(spyBox.methodC).toHaveBeenCalled()
    })
    it('override and overload methods in the subclass',
      function () {
        // @given
        var Shape = _x.createCls(
          {
            methods: [
              function draw () {
                spyBox.methodA()
              }
            ]
          }
        )
        var Circle = _x.createCls(
          {
            methods: [
              function draw () {
                spyBox.methodB()
              },
              function draw (position) {
                spyBox.methodC.apply(this, arguments)
              }
            ]
          },
          Shape
        )

        var shape = new Shape()
        shape.draw()
        // @expectation
        expect(spyBox.methodA).toHaveBeenCalled()

        var circle = new Circle()
        circle.draw()
        // @expectation
        expect(spyBox.methodB).toHaveBeenCalled()

        circle = new Circle()
        circle.draw({x: 20, y: 30})
        // @expectation
        expect(spyBox.methodC).toHaveBeenCalledWith({x: 20, y: 30})
      }
    )
    describe('support call parent method', function () {
      it('callParent method is called in the instance method', function () {
        var Shape = _x.createCls(
          {
            methods: [
              function draw () {
                spyBox.methodA.apply(this)
              },
              function draw (position) {
                spyBox.methodB.apply(this, arguments)
              },
              function show () {
                spyBox.methodC.apply(this, arguments)
              }
            ]
          }
        )
        var Circle = _x.createCls(
          {
            methods: [
              function draw () {
                this._callParent()
              },
              function draw (pos) {
                this._callParent(pos)
              }
            ]
          },
          Shape
        )
        var Moon = _x.createCls(
          {
            methods: [
              function draw () {
                this._callParent()
              },
              function draw (pos) {
                this._callParent(pos)
              },
              function show () {
                this._callParent()
              }
            ]
          },
          Circle
        )
        var circle = new Circle()
        circle.draw()
        expect(spyBox.methodA).toHaveBeenCalled()
        circle.draw({x: 20, y: 30})
        expect(spyBox.methodB).toHaveBeenCalledWith({x: 20, y: 30})
        var moon = new Moon()
        moon.show()
        expect(spyBox.methodC).toHaveBeenCalled()
      })
      it(' callParent method is called in construct', function () {
        var Shape = _x.createCls(
          {
            construct: function (name) {
              this.name = name
            },
            props: {
              name: null
            }
          }
        )
        var Circle = _x.createCls(
          {
            construct: function () {
              this._callParent('circle')
            },
            methods: [
              function draw () {
              }
            ]
          },
          Shape
        )
        var circle = new Circle()
        expect(circle.name === 'circle').toBeTruthy()
      })
      it('throw exception if callParent method is called in wrong position of construct method', function () {
        var Shape = _x.createCls(
          {
            construct: function () {
            }
          }
        )
        var Circle = _x.createCls(
          {
            construct: function () {
              this.draw()
              this._callParent()
            },
            methods: [
              function draw () {
              }
            ]
          },
          Shape
        )

        try {
          var circle = new Circle()
        } catch (e) {
          expect(e.message.toLowerCase()).toContain('callparent method must be called at the beginning')
        }
      })
      it('callParent method is called with arguments', function () {
        var Shape = _x.createCls(
          {
            methods: [
              function jump (number) {
                spyBox.methodA.apply(this, arguments)
              }
            ]
          }
        )
        var Circle = _x.createCls(
          {
            methods: [
              function jump (number) {
                this._callParent(arguments)
              }
            ]
          },
          Shape
        )
        var circle = new Circle()
        circle.jump(3)
        expect(spyBox.methodA).toHaveBeenCalledWith(3)
      })
    })
  })
  describe('Create the class instance through newInstance() method', function () {
    it('for class without constructor', function () {
      var person = _x.createCls({
        props: {
          name: 'Nick'
        }
      }).newInstance()
      expect(person.name).toEqual('Nick')
      var Person = _x.createCls()
      person = Person.newInstance()
      expect(person).isTypeOf(Person)
    })
    it('for class with constructor', function () {
      var person = _x.createCls({
        construct: function () {
          spyBox.methodA.apply(this, arguments)
        },
        props: {
          name: 'Nick'
        }
      }).newInstance()
      expect(spyBox.methodA).toHaveBeenCalled()
      expect(person.name).toBe('Nick')
      person = _x.createCls({
        construct: function (name) {
          this.name = name
        },
        props: {
          name: 'Nick'
        }
      }).newInstance('New name')
      expect(person.name).toBe('New name')
    })
  })
  xdescribe('Support class meta programming', function () {
    describe('Manipulate properties', function () {
    })
    describe('Manipulate methods', function () {
    })
    describe('Manipualte interfaces', function () {
    })
  })
})
