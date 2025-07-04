const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');
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
const withNativeWindConfig = withNativeWind(mergedConfig, { input: './global.css' });
module.exports = wrapWithReanimatedMetroConfig(withNativeWindConfig);
// module.exports = mergeConfig(getDefaultConfig(__dirname), config);
