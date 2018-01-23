module.exports = {
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },

  plugins: [
    'react',
    'import',
    'mocha',
    'flowtype',
    'xod-fp',
    'prettier',
  ],

  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/react',
    'plugin:react/recommended',
    'plugin:flowtype/recommended',
    'airbnb',
    'prettier',
    'prettier/flowtype',
    'prettier/react',
  ],

  globals: {
    fetch: true,
    window: true,
    confirm: true,
    document: true,
    describe: true,
    it: true,
    specify: true,
    before: true,
    beforeEach: true,
    after: true,
    afterEach: true,
    URLSearchParams: true,
  },

  settings: {
    // Ignore “No named exports found in module” when re-exporting
    // ReasonML generated code
    'import/ignore': ['_Js']
  },

  rules: {
    'prettier/prettier': 'error',
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
    // Built-in `no-duplicate-imports` rule does not support Flow
    // The check is delegated to `import/no-duplicates` below
    'no-duplicate-imports': 'off',
    'new-cap': ['error', {
      'capIsNewExceptions': ['Maybe', 'Either', 'Tuple', 'StrMap'],
      'capIsNewExceptionPattern': '^(Maybe|Either)\..'
    }],
    'import/no-duplicates': 'error',
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: [
        '**/*.spec.js',
        '**/xod-client-electron/**/*.js',
        '**/xod-client-electron/**/*.jsx',
        '**/xod-client/stories/*.jsx',
        '**/xod-client-browser/tools/*.js',
        '**/xod-client-browser/test-func/*.js',
        '**/xod-client-browser/benchmark/*.js'
      ]
    }],
    'mocha/no-skipped-tests': 'error',
    'mocha/no-exclusive-tests': 'error',

    'react/forbid-prop-types' : 'off' // TODO: enable and make custom propTypes
  },
};
