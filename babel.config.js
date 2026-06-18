const isTest = process.env.NODE_ENV === 'test';

module.exports = {
  presets: [
    'module:@react-native/babel-preset',
    ...(isTest ? [] : ['nativewind/babel']),
  ],
  plugins: [
    '@babel/plugin-transform-export-namespace-from',
    ['module-resolver', { root: ['./src'], alias: { '@': './src' } }],
    ...(isTest ? [] : ['react-native-reanimated/plugin']),
  ],
};
