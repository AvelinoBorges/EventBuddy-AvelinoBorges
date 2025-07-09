const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolver para evitar problemas com react-native-maps na web
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

config.resolver.alias = {
  'react-native-maps': 'react-native-maps/lib/index.web.js',
};

// Configuração para web
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
