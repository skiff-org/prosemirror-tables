import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import external from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';
import resolve from '@rollup/plugin-node-resolve';
import image from '@rollup/plugin-image';
import terser from '@rollup/plugin-terser';
import analyze from 'rollup-plugin-analyzer';
import gzipPlugin from 'rollup-plugin-gzip';

import pkg from './package.json';

export default {
  input: './src/index.js',
  output: [
    {
      file: pkg.main,
      format: 'cjs'
    },
    {
      file: pkg.module,
      format: 'esm'
    }
  ],
  plugins: [
    external(),
    postcss({minimize: true, sourceMap: false}),
    babel({
      exclude: 'node_modules/**'
    }),
    resolve(),
    commonjs({
      include: 'node_modules/**'
    }),
    image(),
    terser(),
    gzipPlugin(),
    analyze()
  ]
};
