# frozen_string_literal: true

# A module containing Misapplied site helpers
module MisappliedHelpers
  def host
    config[:host]
  end

  def vis_preview(visualization, thumbnail = '')
    base_path = URI(visualization.source_file)
                .path.split('/')[-1].split(/(\S*?)(\.\S+)/)[1]
    thumbnail = visualization.data['preview'] || 'preview.png'
    File.join(base_path, thumbnail)
  end

  def prev_title(article)
    article.article_previous.title
  end

  def next_title(article)
    article.article_next.title
  end
end
