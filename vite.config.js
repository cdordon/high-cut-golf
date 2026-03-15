import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        hats: resolve(__dirname, 'hats.html'),
        shirts: resolve(__dirname, 'shirts.html'),
        accessories: resolve(__dirname, 'accessories.html'),
        404: resolve(__dirname, '404.html'),
      },
    },
  },
})