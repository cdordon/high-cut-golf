import { resolve } from 'path';
import { defineConfig } from 'vite';
import { glob } from 'glob';

export default defineConfig({
  build: {
    rollupOptions: {
      // This automatically finds all .html files in your root directory
      input: Object.fromEntries(
        glob.sync('**/*.html', { ignore: ['node_modules/**', 'dist/**'] }).map(file => [
          // This takes the file name (e.g., 'about') as the key
          file.slice(0, file.length - Buffer.from(resolve(file)).toString().endsWith('.html') ? 5 : 5),
          resolve(__dirname, file)
        ])
      ),
    },
  },
});