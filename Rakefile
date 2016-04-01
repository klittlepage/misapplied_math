require 'dotenv'
Dotenv.load
require 'fileutils'
require 'yaml'
require 'highline/import'

config = YAML.load_file('_config.yml')
gallery_dir = config['gallery_dir']

desc 'Create a new visualization'
task :new_viz, :title do |t, args|
  raise 'No visualization directory set' unless File.directory?(gallery_dir)
  title = args.title
  if title =~ /(^.+\/)?(.+)/
    page_dir = File.join(gallery_dir, title)
    if File.directory?(page_dir)
      fail_s = "#{page_dir} already exists. Do you want to overwrite?"
      abort('rake aborted!') if ask(fail_s, ['y', 'n']) == 'n'
    end
    FileUtils.rm_rf(page_dir)
    FileUtils::mkdir_p page_dir
    puts "Creating new visualization directory: #{page_dir}"
    open(File.join(page_dir, 'index.html'), 'w') do |page|
      page.puts '---'
      page.puts 'layout: default'
      page.puts "title: \'#{args.title}\'"
      page.puts "date: #{Time.now.strftime('%Y-%m-%d %H:%M')}"
      page.puts 'keywords: '
      page.puts 'description: '
      page.puts 'gallery_preview: true'
      page.puts 'stylesheet: true'
      page.puts 'js: true'    
      page.puts 'd3: true'     
      page.puts 'omit_footer: true'
      page.puts '---'
    end
    open(File.join(page_dir, 'page.js'), 'w') do |page|
    end
    open(File.join(page_dir, 'style.css'), 'w') do |page|
    end
  else
    puts "Syntax error: #{title} contains unsupported characters"
  end
end
