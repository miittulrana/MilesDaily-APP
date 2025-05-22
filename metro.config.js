const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add configuration for external dependencies
config.resolver.extraNodeModules = new Proxy({}, {
  get: (target, name) => {
    return name in target ? target[name] : undefined;
  }
});

// Ensure these packages are properly resolved
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json', 'mjs'];
config.resolver.assetExts = ['db', 'mp3', 'ttf', 'obj', 'png', 'jpg'];

module.exports = config;