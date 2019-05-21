_x.exportModule(
  {
    imports: [
      'ui.Shape',
      'ui.features.Drawable'
    ]
  },
  function (Drawable, Shape) {
    return _x.createCls(
      {
        implements: Drawable,
        props: {
          isLineInit: false
        },
        methods: {
          draw: function () {

          },
          drawLine: function () {
            console.log('draw line')
            this.isShapeInit = true
          }
        }
      },
      Shape
    )
  }
)
