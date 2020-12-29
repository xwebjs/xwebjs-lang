_x.exportModule(
  {
    imports: [
      'ui.pen.Line',
      'ui.pen.Circle',
      'common.Collection',
      'common.MagicCollection'
    ]
  },
  function (Line, Circle, Collection, MagicCollection) {
    return _x.createCls(
      {
        props: {
          something: 'something for testing',
          line: null
        },
        staticProps: {
          status: '',
          collection: new Collection()
        },
        staticMethods: {
          main: function () {
            console.log('main function 2 is called')
            var line = new Line()
            var circle = new Circle()
            line.drawLine()
            line.drawShape()
            circle.drawCircle()
            this.$.status = 'done'
          },
          getCollectionSize: function () {
            return this.$.collection.size()
          }
        },
        methods: {
          doSomething: function () {
          },
          getSomething: function () {
            return this.something
          }
        }
      }
    )
  }
)
