const path = require('path');
const exec = require('child_process').exec;
const jsonfile = require('jsonfile');
const fs = require('fs');

function WebpackAssetManifest(options) {
  const defaultOptions = {
    manifestFileName: 'manifest.json',
    assetsFileName: 'assets.js',
    assetManifestFileName: 'assets.json'
  };

  this.options = Object.assign(defaultOptions, options);
}

WebpackAssetManifest.prototype.apply = function(compiler) {
  const options = this.options;
  const manifestPath = path.resolve(compiler.options.output.path,
    options.manifestFileName);
  const assetManifestPath = path.resolve(compiler.options.output.path,
    options.assetManifestFileName);

  compiler.plugin('after-emit', (compilation, callback) => {
    const manifest = jsonfile.readFileSync(manifestPath);
    const compiledAssetsFile = manifest[options.assetsFileName];
    const nodeProcess = exec(`node -e 'require("./${compiledAssetsFile}")'`,
      { cwd: compiler.options.output.path });

    nodeProcess.stdout.pipe(fs.createWriteStream(assetManifestPath));
    nodeProcess.stderr.pipe(process.stderr);

    callback();
  });
};

module.exports = WebpackAssetManifest;
