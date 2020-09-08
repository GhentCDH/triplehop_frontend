const fs = require('fs-extra')

const paths = [
  'assets',
  'components',
  'layouts',
  'middleware',
  'pages',
  'plugins',
  'static',
  'store',
  'test',
  '.babelrc',
  '.eslintrc.js',
  'jest.config.js',
  'nuxt.config.dev.js',
  'nuxt.config.js',
  'nuxt.config.qas.js'
]

for (const path of paths) {
  fs.copy(`crdb_frontend/${path}`, path)
    .then(() => {
      console.log(
        `Original path \x1B[32m${path}\x1B[0m copied successfully.`
      )
      fs.pathExists(`overrides/${path}`)
        .then((exists) => {
          if (exists) {
            fs.copy(`overrides/${path}`, path)
              .then(() => console.log(
                `\x1B[33mOverride path\x1B[0m \x1B[32m${path}\x1B[0m \x1B[33mcopied successfully.\x1B[0m`)
              )
              .catch(err => console.log(err))
          }
        })
    })
    .catch(err => console.log(err))
}
