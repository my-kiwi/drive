import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: './', // Ensures relative paths are used in the generated HTML,
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/three/examples/jsm/libs/draco/',
          dest: 'libs' // this becomes /draco/ in your built output
        }
      ]
    })
  ]
});


