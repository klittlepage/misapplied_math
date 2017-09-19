# frozen_string_literal: true

# A module containing webpack helpers
module WebpackHelpers
  def manifest_cache
    @manifest_cache ||= {}
  end
  private :manifest_cache

  def load_prod_resource(file_name)
    return manifest_cache[file_name] if manifest_cache.key?(file_name)
    manifest_path = File.join(config[:asset_build_dir], 'assets', file_name)
    return nil unless File.exist?(manifest_path)
    manifest = JSON.parse(File.read(manifest_path))
    manifest_cache[file_name] = manifest
    manifest
  end

  def load_build_resource(file_name)
    if config[:environment].to_s == 'production'
      load_prod_resource(file_name)
    else
      manifest_path = File.join(config[:asset_build_dir], 'assets', file_name)
      return nil unless File.exist?(manifest_path)
      JSON.parse(File.read(manifest_path))
    end
  end
  private :load_build_resource

  def webpack_asset_path(asset)
    manifest = load_build_resource('manifest.json')
    return asset unless manifest
    manifest.key?(asset) ? File.join('assets', manifest[asset]) : asset
  end

  def webpack_image_path(image)
    assets = load_build_resource('assets.json')
    return image unless assets&.key?(image)
    resource = assets[image]
    return resource if resource.start_with?('data:image/')
    File.join('assets', resource)
  end
end
