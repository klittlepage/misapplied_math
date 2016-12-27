# frozen_string_literal: true

require 'aws-sdk'
require 'mime/types'

module MisappliedMath
  # Methods to facilitate site deployment
  module Deployment
    def self.deploy_site(bucket, html_expiry, asset_expiry)
      s3 = Aws::S3::Client.new
      Dir.glob('build/**/*')
         .select { |x| !File.directory?(x) && x !~ /.*\.map$/ }.each do |path|
        upload_object(s3, bucket, html_expiry, asset_expiry, path)
      end
    end

    def self.upload_object(s3, bucket, html_expiry, asset_expiry, path)
      mime_type = MIME::Types.type_for(File.extname(path)[1..-1])[0].to_s
      raise "Unknown MIME type for #{x}" unless mime_type
      expiry = mime_type == 'text/html' ? html_expiry : asset_expiry
      File.open(path, 'rb') do |file|
        s3.put_object(bucket: bucket,
                      key: path.sub(%r{^build/}, ''),
                      body: file,
                      cache_control: "max-age=#{expiry}",
                      content_type: mime_type)
      end
    end
  end
end
