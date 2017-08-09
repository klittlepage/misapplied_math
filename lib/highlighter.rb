# frozen_string_literal: true

require 'middleman-syntax'

Middleman::Syntax::Highlighter.instance_eval do
  alias :super_highlight :highlight
  def highlight(code, language = nil, opts = {})
    figure = '<figure class="code-highlight-figure">'
    if opts[:title]
      figure += '<figcaption class="code-highlight-caption">' \
                '<span class="code-highlight-caption-title">' \
                "#{opts[:title]}</span></figcaption>"
    end
    figure += super_highlight(code, language, opts)
    figure += '</figure>'
    figure.html_safe
  end
end
