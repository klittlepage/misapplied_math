const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ESLint = require('eslint/lib/formatters/checkstyle');

const outputPath = path.resolve('.tmp', 'dist', 'assets');
const sourceMapIncludes = path.resolve('node_modules');

const sassLoader = ExtractTextPlugin
  .extract({ fallback: 'style-loader',
    use: [`css-loader?sourceMap&includePaths[]=${sourceMapIncludes}`,
      `sass-loader?sourceMap&includePaths[]=${sourceMapIncludes}`,
      'postcss-loader?sourceMap'],
    publicPath: '/assets/' });

const PROD = (process.env.MIDDLEMAN_ENV === 'production');
const outputNameTemplate = PROD ? '[name]-[chunkhash].min' :
  '[name]-[chunkhash]';

const buildPlugins = [
  new ExtractTextPlugin(`${outputNameTemplate}.css`),
  new ManifestPlugin(),
  new webpack.ProvidePlugin({ $: 'jquery',
    jQuery: 'jquery',
    'window.jQuery': 'jquery' }),
  new CleanWebpackPlugin(outputPath),
  new webpack.LoaderOptionsPlugin(
    {
      debug: true,
      options: {
        eslint: {
          configFile: '.eslintrc',
          failOnWarning: true,
          failOnError: true,
          fix: false,
          outputReport: {
            filePath: path.resolve('.tmp', 'checkstyle.xml'),
            formatter: ESLint,
          },
        },
      },
    }
  ),
];

if (PROD) {
  const uglify = new webpack.optimize.UglifyJsPlugin({ minimize: true,
    sourceMap: true,
    compress: { warnings: false } });
  buildPlugins.push(uglify);
}

module.exports = {
  entry: {
    site: [
      path.resolve('source', 'stylesheets', 'site.scss'),
      path.resolve('source', 'javascripts', 'site.js')
    ],
    visualizations: path.resolve('source', 'javascripts', 'visualizations.js')
  },

  output: {
    path: outputPath,
    filename: `${outputNameTemplate}.js`,
  },

  resolve: {
    extensions: ['.js', '.jsx'],
    modules: [
      'source',
      'node_modules',
    ],
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
      test: /source\/.*\.js$/,
      exclude: /vendor/,
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
      }, {
        loader: 'expose-loader',
        options: '$'
      }]
    }]
  },
  plugins: buildPlugins,
};
