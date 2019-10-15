_x.exportModule(
  {
    imports: [
      'common.Collection'
    ]
  },
  function (Collection) {
    return _x.createCls(
      {
        props: {
          status: 0
        },
        methods: {
          init: function () {
            var collection = new Collection()
            collection.size()
            this.status = 1
          }
        }
      }
    )
  }
)
