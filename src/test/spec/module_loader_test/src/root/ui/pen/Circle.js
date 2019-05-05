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
          drawCircle: function () {
            console.log('draw circle')
            this.isShapeInit = true
          }
        }
      },
      Shape
    )
  }
)
