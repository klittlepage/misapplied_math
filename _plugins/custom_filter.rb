require 'uri'

module CustomFilters
  
  def asset_directory(input)
    return "" if input.nil? or input.empty?
    path = input.split('/')
    if path.last.include?('.')
      return path[0...-1].join('/').chomp('/') + '/'
    else
      path = input.chomp('/') + '/'
    end
  end

end

Liquid::Template.register_filter(CustomFilters)
