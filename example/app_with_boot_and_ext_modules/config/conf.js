var Conf = {
  core: {
    libs: ['xwebjs']
  },
  cache: {
    core: true
  },
  entryType: 'M',
  vmInfo: {
    loader: {
      bootPath: '/vm/boot',
      extPath: '/vm/ext'
    },
    bootModules: [
      'Core'
    ],
    extModules: [
      'Ext', 'common.MagicCollection'
    ]
  },
  mainProgramInfo: {
    loader: {
      basePath: 'program'
    },
    entryClassName: 'MainProgram',
    programId: 'example3'
  }
}
