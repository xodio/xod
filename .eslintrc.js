module.exports = {
  'parserOptions': {
    'ecmaVersion': 6,
    'sourceType': 'module',
    'ecmaFeatures': {
      'jsx': true,
    }
  },

  'plugins': [
    'react',
    'import',
  ],

  'extends': [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/react',
    'plugin:react/recommended',
    'airbnb',
  ],

  'settings': {
    'import/resolver': ['node', 'webpack'],
  },

  'rules': {
    'import/extensions': [2, 'never'],
  },

};
