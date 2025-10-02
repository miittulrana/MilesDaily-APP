const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json', 'mjs'];

config.server = {
  enhanceMiddleware: (middleware) => {
    return middleware;
  },
};

module.exports = config;