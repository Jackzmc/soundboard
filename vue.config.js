const webpack = require('webpack')
module.exports = {
    publicPath: process.env.PUBLIC_PATH || '/',
    configureWebpack: config => {
      return {
        plugins: [
          new webpack.DefinePlugin({
            'APPLICATION_VERSION': JSON.stringify(process.env.npm_package_version),
          })
        ]
      }
    },
}