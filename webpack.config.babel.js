// require('babel-register');

import webpack from 'webpack';
import path from 'path';
import CleanWebpackPlugin from 'clean-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import ManifestPlugin from 'webpack-manifest-plugin';
import ESLint from 'eslint/lib/formatters/checkstyle';
import SassLint from 'sasslint-webpack-plugin';
import WebpackAssetManifest from './webpack_plugins/asset_manifest';

const outputPath = path.resolve('.tmp', 'dist', 'assets');
const sourceMapIncludes = path.resolve('node_modules');
const PROD = (process.env.MIDDLEMAN_ENV === 'production');
const outputNameTemplate = PROD ? '[name]-[chunkhash].min' :
  '[name]-[chunkhash]';

const buildPlugins = [
  new CleanWebpackPlugin(outputPath),
  new ExtractTextPlugin(`${outputNameTemplate}.css`),
  new ManifestPlugin(),
  new SassLint({
    glob: 'source/stylesheets/*.s?(a|c)ss',
    ignorePlugins: ['extract-text-webpack-plugin'],
    failOnWarning: true,
    failOnError: true
  }),
  new WebpackAssetManifest()
];

const imageLoaders = [
  {
    loader: 'url-loader?[name]-[chunkhash].[ext]',
    options: {
      limit: 8192
    }
  }
];

if (PROD) {
  const uglify = new webpack.optimize.UglifyJsPlugin({
    minimize: true,
    sourceMap: true,
    compress: { warnings: false }
  });
  buildPlugins.push(uglify);

  imageLoaders.push({
    loader: 'image-webpack-loader',
    options: {
      gifsicle: {
        interlaced: false,
      },
      optipng: {
        optimizationLevel: 7,
      },
      pngquant: {
        quality: '90-100',
      },
      mozjpeg: {
        quality: 90
      }
    }
  });
}

module.exports = {
  cache: true,
  devtool: 'source-map',

  entry: {
    site: [
      path.resolve('source', 'stylesheets', 'site.scss'),
      path.resolve('source', 'javascripts', 'site.js')
    ],
    visualizations: path.resolve('source', 'javascripts', 'visualizations.js'),
    assets: path.resolve('source', 'javascripts', 'assets.js')
  },

  output: {
    path: outputPath,
    filename: `${outputNameTemplate}.js`,
  },

  resolve: {
    extensions: ['.js', '.jsx'],
    modules: [
      'source',
      'source/blog_posts',
      'source/visualizations',
      'node_modules',
    ],
  },

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
            configFile: '.eslintrc',
            failOnWarning: true,
            failOnError: true,
            fix: false,
            outputReport: {
              filePath: 'checkstyle.xml',
              formatter: ESLint,
            },
          }
        },
      ],
    }, {
      test: /\.(scss|sass)$/,
      use: ExtractTextPlugin.extract({
        use: [
          {
            loader: 'css-loader',
            options: {
              sourceMap: false,
              includePaths: [sourceMapIncludes],
              importLoaders: 2
            }
          }, {
            loader: 'postcss-loader',
            options: {
              sourceMap: false,
              includePaths: [sourceMapIncludes],
              // eslint-disable-next-line global-require
              plugins: () => [require('autoprefixer')]
            }
          }, {
            loader: 'sass-loader',
            options: {
              sourceMap: false,
              includePaths: [sourceMapIncludes]
            }
          }
        ]
      })
    }, {
      test: /\.(gif|png|jpe?g|svg)$/,
      use: imageLoaders
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
