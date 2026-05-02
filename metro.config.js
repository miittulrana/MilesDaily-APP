const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json', 'cjs', 'mjs'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@supabase/')) {
    const packageName = moduleName.split('/')[1].split('/')[0];
    const basePath = `${context.projectRoot}/node_modules/@supabase/${packageName}/dist`;

    const fs = require('fs');

    // Try .cjs first (works better for React Native), then .mjs for web
    const cjsPath = `${basePath}/index.cjs`;
    const mjsPath = `${basePath}/index.mjs`;

    if (fs.existsSync(cjsPath)) {
      return {
        filePath: cjsPath,
        type: 'sourceFile',
      };
    }

    if (fs.existsSync(mjsPath)) {
      return {
        filePath: mjsPath,
        type: 'sourceFile',
      };
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;