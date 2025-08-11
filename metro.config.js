// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);
const config = {};

const mergedConfig = mergeConfig(defaultConfig, config);

// Add NativeWind support (if you're using ./global.css for IntelliSense or future support)
const withNativeWindConfig = withNativeWind(mergedConfig, { input: './global.css' });

module.exports = withNativeWindConfig;
