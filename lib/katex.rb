# frozen_string_literal: true

require 'execjs'

# A module to facilitate math typesetting via katex
module Katex
  def katex
    unless @katex
      script = File.open(File.join(File.dirname(__FILE__), 'katex.min.js'),
                         'r').read
      @katex = ExecJS.compile(script)
    end
    @katex
  end

  def katex_math(text, opts = {})
    katex.call('katex.renderToString', text, merged_opts(opts))
  end

  private

  def merged_opts(opts)
    opts.merge(macros: { "\\E": '\\mathbb{E}', "\\O": '\\mathbb{O}' })
  end
end
