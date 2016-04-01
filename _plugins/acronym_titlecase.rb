class String
  old_titlecase = instance_method(:titlecase)
  define_method(:titlecase) do
    acronyms = %w(cs hft)
    x = old_titlecase.bind(self).().split(" ").map do |word|
      if acronyms.include?(word.gsub(/\W/, "").downcase)
        word.upcase!
      end
      word
    end
    x.join(" ")
  end
end
