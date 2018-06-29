var path = require('path');

module.exports = {
  entry: './src/main/webapp/index.js',
  output: {
    path: path.join(__dirname, 'grails-app/assets/javascripts'),
    publicPath: '/assets/',
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.join(__dirname, 'src/main/webapp'),
        use: {
          loader: 'babel-loader',
          options: {
            presets: ["react", ["es2015", {"modules": false}]],
            plugins: ["transform-class-properties"]
          }
        }
      },
        {
            test: /\.css$/,
            exclude: /node_modules/,
            use: [
                {
                    loader: 'style-loader',
                },
                {
                    loader: 'css-loader',
                    options: {
                        importLoaders: 1,
                    }
                },
                {
                    loader: 'postcss-loader'
                }
            ]
        },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        use: {
          loader: 'url-loader?limit=10000&prefix=assets/!img'
        }
      }
    ]
  }
};

