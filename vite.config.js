import { resolve } from 'path';
import { defineConfig } from 'vite';
import { glob } from 'glob';
import injectHTML from 'vite-plugin-html-inject';

export default defineConfig({
  plugins: [
    injectHTML() // Make sure this is here!
  ],
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        glob.sync('**/*.html', { ignore: ['node_modules/**', 'dist/**', 'parts/**'] }).map(file => [
          file.slice(0, file.length - 5),
          resolve(__dirname, file)
        ])
      ),
    },
  },
});