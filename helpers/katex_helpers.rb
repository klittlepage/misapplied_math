# frozen_string_literal: true

require 'lib/katex'

# A module containing methods to render katex segments
module KatexHelpers
  include Katex

  def m(text)
    katex_math(text)
  end

  def mb(text)
    katex_math(text, displayMode: true)
  end
end
