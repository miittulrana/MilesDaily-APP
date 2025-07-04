module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Remove the deprecated plugin as per the warning
    // plugins: ['expo-router/babel'],
  };
};