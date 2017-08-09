var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var ManifestPlugin = require('webpack-manifest-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var ESLint = require('eslint/lib/formatters/checkstyle');

var outputPath = path.join(__dirname, '.tmp', 'dist', 'assets');
var sourceMapIncludes =  path.join(__dirname, 'node_modules');

var sassLoader = ExtractTextPlugin.
  extract({fallback: 'style-loader',
           use: ['css-loader?sourceMap&includePaths[]=' + sourceMapIncludes,
                 'sass-loader?sourceMap&includePaths[]=' + sourceMapIncludes,
                 'postcss-loader?sourceMap'],
           'publicPath':'/assets/'});

var PROD = (process.env.MIDDLEMAN_ENV === 'production');
var outputNameTemplate = PROD ? '[name]-[chunkhash].min' : '[name]-[chunkhash]';

var buildPlugins = [
    new ExtractTextPlugin(outputNameTemplate + '.css'),
    new ManifestPlugin(),
    new webpack.ProvidePlugin({$: 'jquery', jQuery: 'jquery',
                               'window.jQuery': 'jquery'}),
    new CleanWebpackPlugin(outputPath),
    new webpack.LoaderOptionsPlugin(
      {
        debug: true,
        options: {
          eslint: {
            configFile: path.join(__dirname, 'node_modules',
                                  '/eslint-config-airbnb-base', '.eslintrc'),
            failOnWarning: false,
            failOnError: true,
            fix: true,
            outputReport: {
              filePath: path.join(__dirname, '.tmp', 'checkstyle.xml'),
              formatter: ESLint,
            },
          },
        },
      }
    ),
];

if(PROD) {
  uglify = new webpack.optimize.UglifyJsPlugin({minimize: true,
                                                sourceMap: true,
                                                compress: { warnings: false }});
  buildPlugins.push(uglify);
}

module.exports = {
  entry: {
    site: [
      './source/stylesheets/site.scss',
      './source/javascripts/site.js',
    ],
    visualizations: './source/javascripts/visualizations.js',
  },

  output: {
    path: outputPath,
    filename: outputNameTemplate + '.js',
  },

  resolve: {
    modules: [path.join(__dirname, 'node_modules'),
              path.join(__dirname, 'source')],
  },

  cache: true,
  devtool: 'source-map',

  module: {
    rules: [{
      test: /source\/.*\.js$/,
      use: [
        {
          loader: 'babel-loader',
          options: {
            presets: 'es2015'
          }
        }
      ],
    }, {
      test: /\.js$/,
      exclude: /node_modules|\.tmp|vendor/,
      enforce: 'pre',
      use: [
        {
          loader: 'eslint-loader',
          options: {
            emitWarning: true,
          }
        },
      ],
    }, {
      test: /.*\.scss$/,
      use: sassLoader
    }, { 
      test: /\.(png|jpg|jpeg)$/,
      use: [
        {
          loader: 'url-loader?[name]-[chunkhash].[ext]',
          options: {
            limit: 8192
          }
        }
      ]
    }, {
      test: /\.ico$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            mimetype: 'image/x-icon'
          }
        }
      ]
    }, {
      test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'application/font-woff'
          }
        }
      ]
    }, {
      test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'application/font-woff'
          }
        }
      ]
    }, {
      test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'application/octet-stream'
          }
        }
      ]
    }, {
      test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
      use: 'file-loader'
    }, {
      test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'image/svg+xml'
          }
        }
      ]
    }, {
      test: require.resolve('jquery'),
      use: [{
          loader: 'expose-loader',
          options: 'jQuery'
      },{
          loader: 'expose-loader',
          options: '$'
      }]
    }]
  },
  plugins: buildPlugins,
};
