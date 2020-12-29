_x.exportModule(
  {
    imports: [
      'ui.pen.Line',
      'ui.pen.Circle'
    ]
  },
  function (Line, Circle) {
    return _x.createCls(
      {
        props: {
          something: 'something for testing',
          line: null
        },
        staticProps: {
          status: ''
        },
        staticMethods: {
          main: function () {
            console.log('main function 1 is called')
            var line = new Line()
            var circle = new Circle()
            line.drawLine()
            line.drawShape()
            circle.drawCircle()
            this.$.status = 'done'
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
