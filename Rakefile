# frozen_string_literal: true

require 'bundler'
require 'dotenv/tasks'
require 'aws-sdk'
require 'uri'
require './lib/deployment'

def bucket(environment)
  case environment
  when 'staging'
    ENV['AWS_S3_STAGING_BUCKET']
  when 'production'
    ENV['AWS_S3_DEPLOYMENT_BUCKET']
  else
    abort('Invalid environment passed as an argument to rake')
  end
end

task check_env: :dotenv do
  keys = %w[MISAPPLIED_HOST AWS_S3_STAGING_BUCKET AWS_S3_DEPLOYMENT_BUCKET
            AWS_ACCESS_KEY AWS_SECRET_KEY]
  keys.each do |key|
    abort("#{key} must be defined in your environment") unless ENV[key]
  end
end

task :deploy, %i[environment html_expiry
                 asset_expiry] => :check_env do |_, args|
  environment = args[:environment] || 'staging'
  html_expiry = args[:html_expiry] || 15
  asset_expiry = args[:asset_expiry] || 31_536_000
  MisappliedMath::Deployment.deploy_site(bucket(environment), html_expiry,
                                         asset_expiry)
end

task :legacy_redirects, [:environment] => :check_env do |_, args|
  environment = args[:environment] || 'staging'
  s3 = Aws::S3::Client.new
  ['about.html', 'categories.html', 'reading-list.html'].each do |x|
    redirect = URI.join(ENV['MISAPPLIED_HOST'],
                        x.split(/(.+)\.html/)[1] + '/').to_s
    s3.put_object(bucket: bucket(environment), key: x, body: '',
                  website_redirect_location: redirect)
  end
end

task default: [:deploy]
