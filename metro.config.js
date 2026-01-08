const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {};
const defaultConfig = getDefaultConfig(__dirname);
defaultConfig.resolver.sourceExts = [
  ...defaultConfig.resolver.sourceExts,
  'css',
];

module.exports = withNativeWind(mergeConfig(defaultConfig, config), {
  input: './global.css',
});
