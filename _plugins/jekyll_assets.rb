require 'jekyll-assets'
require 'sprockets'
require 'yui/compressor'
require 'closure-compiler'

Sprockets.register_compressor 'application/javascript',
  :yui_js, YUI::JavaScriptCompressor.new

Sprockets.register_compressor 'text/css',
  :yui_css, YUI::CssCompressor.new

Sprockets.register_compressor 'application/javascript',
  :closure, Closure::Compiler.new
