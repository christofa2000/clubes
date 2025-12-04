module.exports = {
  root: true,
  extends: ['../../packages/eslint-config', 'next/core-web-vitals'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname
  },
  ignorePatterns: ['.next', 'node_modules']
};











