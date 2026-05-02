module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 2021,
  },
  rules: {
    'linebreak-style': ['error', 'unix'],
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
    'import/no-extraneous-dependencies': ['error', { devDependencies: true, packageDir: __dirname }],
    'no-param-reassign': ['error', { props: false }],
  },
};
