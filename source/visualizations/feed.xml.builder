# frozen_string_literal: true

xml.instruct!
xml.feed 'xmlns' => 'http://www.w3.org/2005/Atom' do
  site_url = URI.join(host, blog('visualizations').options.prefix)
  xml.title data.site.title
  xml.subtitle data.site.subtitle
  xml.id URI.join(site_url, blog('visualizations').options.prefix.to_s)
  xml.link 'href' => URI.join(site_url, blog('visualizations') \
                     .options.prefix.to_s)
  xml.link 'href' => URI.join(site_url, current_page.path), 'rel' => 'self'
  xml.updated(blog('visualizations').articles.first.date.to_time.iso8601) \
    unless blog('visualizations').articles.empty?
  xml.author { xml.name data.site.author }

  blog('visualizations').articles[0..5].each do |article|
    xml.entry do
      xml.title article.title
      xml.link 'rel' => 'alternate', 'href' => URI.join(site_url, article.url)
      xml.id URI.join(site_url, article.url)
      xml.published article.date.to_time.iso8601
      xml.updated File.mtime(article.source_file).iso8601
      xml.author { xml.name article.data.author || data.site.author }
    end
  end
end
