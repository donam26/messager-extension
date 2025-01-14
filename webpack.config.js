const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'production',

  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'cheap-module-source-map',

  entry: {
    background: './src/background.js',
    messager: './src/messager.js',
    facebook: './src/facebook.js',
    business: './src/business.js',
    popup: './src/popup.js'
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: '/',
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader'
        ],
      },
      {
        test: /\.(?:js|mjs|cjs|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: "defaults" }],
              '@babel/preset-react' 
            ]
          }
        }
      }
    ],
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },

  resolve: {
    fallback: {
      "fs": false,
      "path": false,
      "crypto": false,
      "process": require.resolve("process/browser")
    },
    alias: {
      process: "process/browser"
    }
  }
};