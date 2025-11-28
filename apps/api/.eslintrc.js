module.exports = {
  root: true,
  extends: ['../../packages/eslint-config'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname
  },
  env: {
    node: true
  },
  ignorePatterns: ['dist', 'node_modules']
};

