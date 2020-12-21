// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';


export default {
    input:  "./dist/Echo.js",
    output: {
      file: './dist/bundle.js',
      format: 'iife'
    },
    plugins: [resolve()]
  };
