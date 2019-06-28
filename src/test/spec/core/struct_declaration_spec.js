// eslint-disable-next-line no-unused-vars
describe('Declare structure', function () {
  var spyBox
  beforeEach(function () {
    spyBox = jasmine.createSpyObj('', ['methodA', 'methodB', 'methodC', 'methodD'])
// eslint-disable-next-line no-undef
    jasmine.addMatchers(methodMetaMatchers)
  })
  describe('Declare empty structure', function () {
    it('Check whether it is structure', function () {
      var strData = _x.createStructure()
      expect(_x.isStructure(strData)).toBeTruthy()
    })
  })
  describe('Declare structure with property', function () {
    it('Empty property', function () {
      var strData = _x.createStructure({})
      expect(_x.isStructure(strData)).toBeTruthy()
    })
    it('One property with value', function () {
      var PersonStr = _x.createStructure({
        props: {
          name: ''
        }
      })
      var personData = PersonStr.valueOf({
        name: 'superman'
      })
      expect(personData.name).toEqual('superman')
    })
    it('One property without value assignment', function () {
      var PersonStr = _x.createStructure({
        props: {
          name: undefined
        }
      })
      var personData = PersonStr.valueOf()
      expect(personData.name).toBe(undefined)
      personData = PersonStr.valueOf({})
      expect(personData.name).toEqual(undefined)
    })
    it('Invalid property name', function () {
      var PersonStr = _x.createStructure({
        props: {
          name: undefined
        }
      })
      try {
        var personData = PersonStr.valueOf(
          {
            na: 'superman'
          }
        )
        fail('Should throw exception')
      } catch (e) {
        expect(e.message.toLowerCase()).toContain(
          'the property name "na" is not valid property name in the structure'.toLowerCase()
        )
      }
    })
  })
})
