# frozen_string_literal: true

require 'kramdown'
require 'lib/katex'

module Kramdown
  # Kramdown extension to katex instead of MathJax
  module Converter
    Html.class_eval do
      include Katex

      alias_method :super_convert_math, :convert_math
      def convert_math(el, _indent)
        katex_math(el.value, displayMode: true)
      end
    end
  end
end
