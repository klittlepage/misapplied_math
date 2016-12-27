var PROD = (process.env.MIDDLEMAN_ENV === 'production')

var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var ManifestPlugin = require('webpack-manifest-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');

var outputPath = path.join(__dirname, '.tmp', 'dist', 'assets');
var sourceMapIncludes =  path.join(__dirname, "node_modules");

var sassLoader = ExtractTextPlugin.
  extract("style-loader",
          ["css-loader?sourceMap&includePaths[]=" + sourceMapIncludes, 
          "postcss-loader",
          "sass-loader?sourceMap&includePaths[]=" + sourceMapIncludes],
          { "publicPath":"/assets/" });

var outputNameTemplate = PROD ? '[name]-[chunkhash].min' : '[name]-[chunkhash]';

var buildPlugins = [
    new ExtractTextPlugin(outputNameTemplate + ".css"),
    new ManifestPlugin(),
    new webpack.ProvidePlugin({$: "jquery", jQuery: "jquery",
                               "window.jQuery": "jquery"}),
    new CleanWebpackPlugin(outputPath),
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

  resolve: {
    root: path.join(__dirname, 'source', 'javascripts'),
  },

  output: {
    path: outputPath,
    filename: outputNameTemplate + '.js',
  },

  cache: true,
  debug: true,
  devtool: 'source-map',

  module: {
    loaders: [{
      test: /source\/javascripts\/.*\.js$/,
      exclude: /node_modules|\.tmp|vendor/,
      loader: 'babel-loader',
      query: { presets: ['es2015'] }
    }, {
      test: /.*\.scss$/,
      loader: sassLoader
    }, { 
      test: /\.(png|jpg|jpeg)$/,
      loader: 'url-loader?[name]-[chunkhash].[ext]&limit=8192'
    }, {
      test: /\.ico$/,
      loader: 'url-loader?mimetype=image/x-icon'
    }, {
      test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
      loader: "url-loader?limit=10000&mimetype=application/font-woff"
    }, {
      test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
      loader: "url-loader?limit=10000&mimetype=application/font-woff"
    }, {
      test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
      loader: "url-loader?limit=10000&mimetype=application/octet-stream"
    }, {
      test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
      loader: "file-loader"
    }, {
      test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
      loader: "url-loader?limit=10000&mimetype=image/svg+xml"
    }, { 
      test: require.resolve('jquery'),
      loader: 'expose-loader?jQuery!expose-loader?$' 
    }]
  },
  plugins: buildPlugins,
};
