import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        hats: resolve(__dirname, 'hats.html'),
        shirts: resolve(__dirname, 'shirts.html'),
        accessories: resolve(__dirname, 'accessories.html'),
        privacy: resolve(__dirname, 'privacy.html'), // ADD THIS LINE
        404: resolve(__dirname, '404.html'),
      },
    },
  },
})