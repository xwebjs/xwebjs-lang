describe('Declare interface', function () {
// eslint-disable-next-line no-unused-vars
  var spyBox
  beforeEach(function () {
    spyBox = jasmine.createSpyObj('', ['methodA', 'methodB', 'methodC', 'methodD'])
// eslint-disable-next-line no-undef
    jasmine.addMatchers(methodMetaMatchers)
  })
  describe('Declare interface with static properties without parent interface', function () {
    it('Has static properties', function () {
      var contract = _x.createIf({
        props: {
          NAME: 'Deal',
          MAX_AMOUNT: 100
        }
      })
      expect(contract.getValue('NAME')).toEqual('Deal')
      expect(contract.getValue('MAX_AMOUNT')).toEqual(100)
    })
  })
  describe('Declare interface with methods without parent interface', function () {
    it('Has no method', function () {
      // @given
      var contract = _x.createIf({})
      // @expect
      expect(contract.isCustomIf === true).toBeTruthy()
    })
    it('Has one method', function () {
      // @given
      var contract = _x.createIf({
        methods: [
          function fly () {}
        ]
      })
      // @expect
      expect(contract.isCustomIf === true).toBeTruthy()
      expect(contract).hasMethodMeta(
        {
          name: 'fly',
          params: []
        }
      )
    })
    it('Has multiple method', function () {
      // @given
      var contract = _x.createIf({
        methods: [
          function fly () {},
          function fly (style) {},
          function jump () {}
        ]
      })
      // @expect
      expect(contract.isCustomIf === true).toBeTruthy()
      expect(contract).hasMethodMeta(
        {
          name: 'fly',
          params: []
        }
      )
      expect(contract).hasMethodMeta(
        {
          name: 'fly',
          params: [
            {
              type: 'any'
            }
          ]
        }
      )
      expect(contract).hasMethodMeta(
        {
          name: 'jump',
          params: []
        }
      )
    })
  })
  describe('Declare interface with methods with parent interface', function () {
    it('Has one inherited interface', function () {
      // @given
      var pContract = _x.createIf({
        methods: [
          function fly () {}
        ]
      })
      var contract = _x.createIf({
        methods: [
          function speak () {
          }
        ]
      }, pContract)
      // @expect
      expect(contract.isCustomIf === true).toBeTruthy()
      expect(contract).hasMethodMeta(
        {
          name: 'fly',
          params: []
        }
      )
      expect(contract).hasMethodMeta(
        {
          name: 'speak',
          params: []
        }
      )
    })
    it('Has multiple inherited interfaces', function () {
      // @given
      var sJump = _x.createIf({
        methods: [
          function jump () {}
        ]
      })
      var pContract = _x.createIf({
        methods: [
          function fly () {}
        ]
      })
      var contract = _x.createIf({
        methods: [
          function speak () {
          }
        ]
      }, [pContract, sJump])
      // @expect
      expect(contract.isCustomIf === true).toBeTruthy()
      expect(contract).hasMethodMeta(
        {
          name: 'fly',
          params: []
        }
      )
      expect(contract).hasMethodMeta(
        {
          name: 'speak',
          params: []
        }
      )
      expect(contract).hasMethodMeta(
        {
          name: 'jump',
          params: []
        }
      )
    })
  })
  describe('For implementation provider, validate based on interface',
    function () {
      var contract = _x.createIf({
        methods: [
          function fly () {}
        ]
      })
      it('Throw exception when class validation fails', function (done) {
        try {
          _x.createCls(
            {
              methods: {},
              implements: [
                contract
              ]
            }
          )
          done.fail('expected to throw exception, but not')
        } catch (e) {
          expect(e.message.indexOf('declared class does not implement required methods in declared interface') !== -1).toBeTruthy()
          done()
        }
      })
      it('No exception contract when class validation succeed ', function (done) {
        try {
          _x.createCls(
            {
              methods: {
                fly: function () {
                  console.log('fly')
                }
              },
              implements: [
                contract
              ]
            }
          )
          expect(true).toBeTruthy()
          done()
        } catch (e) {
          done.fail('Not expected to have exception')
        }
      })
    }
  )
  describe('For implementation provider, validate based on interface which has prent interface',
    function () {
      var CanSpeak, CanWalk, CanFly, CanAll
      beforeEach(function () {
        CanSpeak = _x.createIf({
          methods: [
            function speak () {}
          ]
        })
        CanWalk = _x.createIf({
          methods: [
            function walk (a) {}
          ]
        })
        CanFly = _x.createIf({
          methods: [
            function fly () {}
          ]
        })
        CanAll = _x.createIf({
          methods: []
        }, [CanWalk, CanSpeak, CanFly])
      })
      it('Throw exception when class validation fails', function (done) {
        try {
          _x.createCls(
            {
              methods: {
                fly: function () {},
                walk: function (a, b, c) {}
              },
              implements: [
                CanAll
              ]
            }
          )
          done.fail('expected to throw exception, but not')
        } catch (e) {
          expect(e.message.indexOf('declared class does not implement required methods in declared interface') !== -1).toBeTruthy()
          done()
        }
      })
      it('No exception contract when class validation succeed ', function (done) {
        try {
          _x.createCls(
            {
              methods: {
                fly: function () {
                  console.log('fly')
                },
                walk: function (a) {
                  console.log('walk')
                },
                speak: function () {
                  console.log('speak')
                }
              },
              implements: [
                CanAll
              ]
            }
          )
          expect(true).toBeTruthy()
          done()
        } catch (e) {
          fail('Not expected to have exception')
        }
      })
    }
  )
})
