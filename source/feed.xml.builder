xml.instruct!
xml.feed "xmlns" => "http://www.w3.org/2005/Atom" do
  site_url = URI.join(host, blog('blog').options.prefix)
  xml.title data.site.title
  xml.subtitle data.site.subtitle
  xml.id URI.join(site_url, blog('blog').options.prefix.to_s)
  xml.link "href" => URI.join(site_url, blog('blog').options.prefix.to_s)
  xml.link "href" => URI.join(site_url, current_page.path), "rel" => "self"
  xml.updated(blog('blog').articles.first.date.to_time.iso8601) unless blog('blog').articles.empty?
  xml.author { xml.name data.site.author }

  blog('blog').articles[0..5].each do |article|
    xml.entry do
      xml.title article.title
      xml.link "rel" => "alternate", "href" => URI.join(site_url, article.url)
      xml.id URI.join(site_url, article.url)
      xml.published article.date.to_time.iso8601
      xml.updated File.mtime(article.source_file).iso8601
      xml.author { xml.name article.data.author || data.site.author }
      xml.summary article.summary, "type" => "html"
      xml.content article.body, "type" => "html"
    end
  end
end
