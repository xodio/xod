module.exports = {
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },

  plugins: [
    'react',
    'import',
  ],

  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/react',
    'plugin:react/recommended',
    'airbnb',
  ],

  globals: {
    window: true,
    document: true,
    describe: true,
    it: true,
    before: true,
    beforeEach: true,
    after: true,
    afterEach: true,
  },

  rules: {
    'no-underscore-dangle': ['error', {
      allow: ["__"], /* Ramda’s R.__ */
      allowAfterThis: true,
      allowAfterSuper: true
    }],
    'new-cap': ['error', {
      'capIsNewExceptions': ['Maybe', 'Either'],
      'capIsNewExceptionPattern': '^(Maybe|Either)\..'
    }],
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: [
        '**/*.spec.js',
        '**/xod-client-electron/**/*.js',
        '**/xod-client-electron/**/*.jsx',
        '**/xod-client/**/DevTools.jsx'
      ]
    }],

    'jsx-a11y/no-static-element-interactions' : 'off', // TODO: enable and fix
    'react/forbid-prop-types' : 'off' // TODO: enable and make custom propTypes
  },
};
