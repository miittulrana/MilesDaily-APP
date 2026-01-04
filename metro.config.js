const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json', 'cjs'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@supabase/')) {
    const packageName = moduleName.split('/')[1].split('/')[0]; // Get package name only
    const resolvedPath = `${context.projectRoot}/node_modules/@supabase/${packageName}/dist/index.cjs`;
    
    try {
      const fs = require('fs');
      if (fs.existsSync(resolvedPath)) {
        return {
          filePath: resolvedPath,
          type: 'sourceFile',
        };
      }
    } catch (e) {
    }
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;