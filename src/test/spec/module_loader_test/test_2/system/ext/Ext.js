_x.exportModule(
  {
    imports: []
  },
  function () {
    return _x.createCls(
      {
        props: {
          status: 0
        },
        methods: {
          init: function () {
            this.status = 1
          }
        }
      }
    )
  }
)
