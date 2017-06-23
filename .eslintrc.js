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
    'mocha',
    'xod-fp',
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
    specify: true,
    before: true,
    beforeEach: true,
    after: true,
    afterEach: true,
  },

  rules: {
    'xod-fp/max-composition-depth': ['error', {
      max: 11, // TODO: it should be lowered to 6
      ignoreCurry: true,
      ignoreMocha: true,
    }],
    'no-underscore-dangle': ['error', {
      allow: ["__"], /* Ramda’s R.__ */
      allowAfterThis: true,
      allowAfterSuper: true
    }],
    'new-cap': ['error', {
      'capIsNewExceptions': ['Maybe', 'Either', 'Tuple', 'StrMap'],
      'capIsNewExceptionPattern': '^(Maybe|Either)\..'
    }],
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: [
        '**/*.spec.js',
        '**/xod-client-electron/**/*.js',
        '**/xod-client-electron/**/*.jsx',
        '**/xod-client/**/DevTools.jsx',
        '**/xod-client/stories/*.jsx',
        '**/xod-client-browser/tools/*.js'
      ]
    }],
    'mocha/no-skipped-tests': 'error',
    'mocha/no-exclusive-tests': 'error',

    'react/forbid-prop-types' : 'off' // TODO: enable and make custom propTypes
  },
};
