module Jekyll
  
  class CategoryListTag < Liquid::Tag
    
    def render(context)
      html = ""
      categories = context.registers[:site].categories.keys
      categories.sort.each do |category|
        posts_in_category = context.registers[:site].categories[category].size
        category_dir = context.registers[:site].config['category_dir']
        category_url = File.join(category_dir, category.gsub(/_|\P{Word}/, '-').gsub(/-{2,}/, '-').downcase)
        html << "<li class='category'><h1><a href='/#{category_url}/'>#{category.titlecase} (#{posts_in_category})</a></h1></li>\n"
      end
      html
    end
    
  end

end

Liquid::Template.register_tag('category_list', Jekyll::CategoryListTag)
