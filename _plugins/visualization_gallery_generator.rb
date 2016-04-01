require 'jekyll-paginate'

module Jekyll
  module Generators

    # The VisualizationIndex class creates a gallery view for all visualizations.
    class VisualizationIndex < Page

      # Initialize a new Page.
      #
      # site - The Site object.
      # base - The String path to the source.
      # dir  - The String path between the source and the file.
      def initialize(site, base, dir)
        @site = site
        @base = base
        @dir  = dir
        @name = 'index.html'

        self.process(name)
        self.read_yaml(File.join(site.source, '_layouts'), 
          'visualization_index.html')
        self.data['title'] = site.config['visualization_title'] || 'Visualization gallery'
        # Set the meta-description for this page.
        self.data['description'] = site.config['visualization_description'] || 
          'A gallery of data science visualizations'
      end

    end

    class VisualizationGalleryGenerator < Generator
      # This generator is safe from arbitrary code execution.
      safe true

      def self.gallery_dir(site)
        site.config['gallery_dir'] || 'visualizations'
      end

      # Generate paginated pages if necessary.
      #
      # site - The Site.
      #
      # Returns nothing.
      def generate(site)
        if GalleryPager.pagination_enabled?(site)
          paginate(site, VisualizationIndex.new(site, 
            site.source, VisualizationGalleryGenerator.gallery_dir(site)))
        end
      end

      # Paginates the blog's posts. Renders the index.html file into paginated
      # directories, e.g.: page2/index.html, page3/index.html, etc and adds more
      # site-wide data.
      #
      # site - The Site.
      # page - The index.html Page that requires pagination.
      #
      # {"paginator" => { "page" => <Number>,
      #                   "per_page" => <Number>,
      #                   "posts" => [<Post>],
      #                   "total_posts" => <Number>,
      #                   "total_pages" => <Number>,
      #                   "previous_page" => <Number>,
      #                   "next_page" => <Number> }}
      def paginate(site, page)
        all_visualizations = site.site_payload['site']['pages'].select do |page|
          page.data.key?('gallery_preview')
        end.sort do |one, two|
          date1 = one.data.key?('date') ? DateTime.parse(one.data['date']) : nil
          date2 = two.data.key?('date') ? DateTime.parse(two.data['date']) : nil
          date2 <=> date1
        end
        pages = GalleryPager.calculate_pages(all_visualizations, site.config['paginate_gallery'].to_i)
        (1..pages).each do |num_page|
          pager = GalleryPager.new(site, num_page, all_visualizations, pages)
          if num_page > 1
            render_page = VisualizationIndex.new(site, site.source, 
              GalleryPager.paginate_path(site, num_page))            
          else
            render_page = page
          end
          render_page.pager = pager
          site.pages << render_page
        end
      end

      # Static: Fetch the URL of the template page. Used to determine the
      #         path to the first pager in the series.
      #
      # site - the Jekyll::Site object
      #
      # Returns the url of the template page
      def self.first_page_url(site)
        if page = VisualizationIndex.new(site, 
            site.source, VisualizationGalleryGenerator.gallery_dir(site))
          page.url
        else
          nil
        end
      end

    end

    class GalleryPager < Jekyll::Paginate::Pager

      # Calculate the number of pages.
      #
      # all_visualizations - The Array of all visualizations.
      # per_page  - The Integer of entries per page.
      #
      # Returns the Integer number of pages.
      def self.calculate_pages(all_visualizations, per_page)
        (all_visualizations.size.to_f / per_page.to_i).ceil
      end

      # Determine if pagination is enabled the site.
      #
      # site - the Jekyll::Site object
      #
      # Returns true if pagination is enabled, false otherwise.
      def self.pagination_enabled?(site)
       !site.config['paginate_gallery'].nil? &&
         site.pages.size > 0
      end

      # Static: Return the pagination path of the page
      #
      # site     - the Jekyll::Site object
      # num_page - the pagination page number
      #
      # Returns the pagination path as a string
      def self.paginate_path(site, num_page)
        return nil if num_page.nil?
        return VisualizationGalleryGenerator.first_page_url(site) if num_page <= 1
        format = File.join(VisualizationGalleryGenerator.gallery_dir(site), 
          site.config['paginate_gallery_path'])
        format = format.sub(':num', num_page.to_s)
        result = ensure_leading_slash(format)
        return result
      end

      # Initialize a new Pager.
      #
      # site     - the Jekyll::Site object
      # page      - The Integer page number.
      # all_visualizations - The Array of all the site's visualizations.
      # num_pages - The Integer number of pages or nil if you'd like the number
      #             of pages calculated.
      def initialize(site, page, all_visualizations, num_pages = nil)
        @page = page
        @per_page = site.config['paginate_gallery'].to_i
        @total_pages = num_pages || GalleryPager.calculate_pages(all_visualizations, @per_page)

        if @page > @total_pages
          raise RuntimeError, "page number can't be greater than total pages: #{@page} > #{@total_pages}"
        end

        init = (@page - 1) * @per_page
        offset = (init + @per_page - 1) >= all_visualizations.size ? all_visualizations.size : (init + @per_page - 1)

        @total_posts = all_visualizations.size
        @posts = all_visualizations[init..offset]
        @previous_page = @page != 1 ? @page - 1 : nil
        @previous_page_path = GalleryPager.paginate_path(site, @previous_page)
        @next_page = @page != @total_pages ? @page + 1 : nil
        @next_page_path = GalleryPager.paginate_path(site, @next_page)
      end

    end

  end

  module Filters

    def gallery_preview(visualization)
      gallery_preview = visualization['gallery_preview']
      if gallery_preview and not gallery_preview.kind_of? String
        img_tag = <<-TAG
          <img data-src="holder.js/350x180/text:No Preview Available" alt="#{visualization['description']}">
        TAG
      else
        img_tag = <<-TAG
          <img src="#{visualization['gallery_preview']}" alt="#{visualization['description']}">
        TAG
      end
      html = <<-HTML 
        <a href="#{visualization['url']}">
          <div class="thumbnail">
            #{img_tag}
            <div class="caption">
              <h3>#{visualization['title']}</h3>
              <p>#{visualization['description']}</p>
            </div>
          </div>
        </a>
      HTML
    end

  end

end
