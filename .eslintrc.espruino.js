module.exports = {
  parserOptions: {
    ecmaVersion: 5,
  },

  extends: [
    'eslint:recommended',
    'airbnb',
  ],

  rules: {
    'comma-dangle': ['error', 'never'],
    'func-names': 'off',
    'no-param-reassign': ["error", { "props": false }],
    'no-underscore-dangle': 'off',
    'object-shorthand': ['error', 'never'],
    'prefer-arrow-callback': 'off',
    'space-before-function-paren': ['error', 'never'],
  },

  globals: {
    Pin: true,
    analogRead: true,
    analogWrite: true,
    digitalRead: true,
    digitalWrite: true,
    setWatch: true,
  },
};

