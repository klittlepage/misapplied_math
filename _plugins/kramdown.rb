require 'kramdown'

module Kramdown 
  module Converter
    Html.class_eval do
      alias :super_convert_math :convert_math
      def convert_math(el, indent)
        output = "<div class=mathjax-block-wrapper>\n"
        output << super_convert_math(el, indent)
        output << "</div>\n"
      end
    end
  end
end
