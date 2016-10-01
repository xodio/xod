module.exports = {
  parserOptions: {
    ecmaVersion: 5,
  },

  extends: [
    'eslint:recommended'
  ],

  rules: {
    'comma-dangle': ['error', 'never'],
    'func-names': 'off',
    'no-param-reassign': ["error", { "props": false }],
    'no-underscore-dangle': 'off',
    'no-var': 'off',
    'object-shorthand': ['error', 'never'],
    "one-var": ['error', {
      "uninitialized": 'always',
      "initialized": 'never',
    }],
    'one-var-declaration-per-line': ['error', 'initializations'],
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
    setTimeout: true,
    module: true,
    setInterval: true,
    PULSE: true,
    identity: true,
    require: true,
  },
};
