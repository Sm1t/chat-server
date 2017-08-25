'use strict'

const del = require('del');
const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const pkg = require('../package.json');

let promise = Promise.resolve();

// Clean up the output directory
promise = promise.then(() => del(['dist/*']));

// Compile source code into a distributable format with Babel
promise = promise.then(() => rollup.rollup({
  input: 'src/index.js',
  external: Object.keys(pkg.dependencies),
  plugins: [babel(Object.assign(pkg.babel, {
    babelrc: false,
    exclude: 'node_modules/**',
    runtimeHelpers: true,
    presets: pkg.babel.presets.map(x => (x === 'latest' ? ['latest', { es2015: { modules: false } }] : x)),
  }))],
}).then(bundle => bundle.write({
  dest: 'dist/index.js',
  format: 'cjs', 
  sourceMap: false,
})));


promise.catch(err => console.error(err.stack)); // eslint-disable-line no-console