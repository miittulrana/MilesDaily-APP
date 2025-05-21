const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

// Add these polyfills for Node.js built-in modules
config.resolver.extraNodeModules = {
  'stream': require.resolve('stream-browserify'),
  'crypto': false,
  'net': false,
  'tls': false,
  'fs': false,
  'http': false,
  'https': false,
  'zlib': false
};

config.resolver.sourceExts.push('cjs');

module.exports = config;