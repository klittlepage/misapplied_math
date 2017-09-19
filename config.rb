# frozen_string_literal: true

require 'dotenv'
Dotenv.load

require 'lib/kramdown'
require 'lib/highlighter'

require 'enumerator'

page '/*.xml', layout: false
page '/*.json', layout: false
page '/*.txt', layout: false

ignore %r{^stylesheets/}
ignore %r{^javascripts/}
ignore %r{^fonts/}
ignore %r{^images/}

config[:markdown_engine] = :kramdown
config[:host] = ENV['MISAPPLIED_HOST']
config[:asset_build_dir] = '.tmp/dist'

activate :syntax, line_numbers: true

activate :blog do |blog|
  blog.name = 'blog'
  blog.prefix = ''
  blog.permalink = '{year}/{month}/{day}/{title}.html'
  blog.sources = 'blog_posts/{year}-{month}-{day}-{title}.html'
  blog.layout = 'layouts/blog'
  blog.taglink = 'categories/{tag}.html'
  blog.summary_separator = /(READMORE)/
  blog.summary_length = 250
  blog.year_link = '{year}.html'
  blog.month_link = '{year}/{month}.html'
  blog.generate_day_pages = true
  blog.tag_template = 'tag.html'
  blog.calendar_template = 'calendar.html'
  blog.paginate = true
  blog.page_link = 'page/{num}'
end

activate :blog do |blog|
  blog.name = 'visualizations'
  blog.prefix = 'visualizations'
  blog.permalink = '{title}.html'
  blog.sources = '{year}-{month}-{day}-{title}.html'
  blog.layout = 'site_page'
  blog.calendar_template = ''
  blog.generate_day_pages = false
  blog.generate_month_pages = false
  blog.generate_year_pages = false
  blog.generate_tag_pages = false
  blog.paginate = true
  blog.page_link = 'page/{num}'
end

activate :directory_indexes
page '/googleaf12cef885ef9927.html', directory_index: false

activate :external_pipeline,
         name: :webpack,
         command: if build?
                    'MIDDLEMAN_ENV=production ' \
                    './node_modules/webpack/bin/webpack.js ' \
                    '--bail --optimize-minimize'
                  else
                    './node_modules/webpack/bin/webpack.js --watch -d'
                  end,
         source: config[:asset_build_dir],
         latency: 1

configure :development do
  activate :livereload
end

configure :build do
  activate :minify_html
end
