module.exports = {
  parserOptions: {
    ecmaVersion: 5,
  },

  extends: [
    'eslint:recommended',
    'airbnb',
  ],

  rules: {
    'no-underscore-dangle': 'off',
    'func-names': 'off',
    'space-before-function-paren': ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'object-shorthand': ['error', 'never'],
    'prefer-arrow-callback': 'off',
  },

  globals: {
    analogRead: true,
  },
};

