import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/main.ts')
      },
      output: {
        entryFileNames: 'index.umd.js',
        format: 'umd',
        name: 'ScubaCoderChatPanel',
        globals: {},
        assetFileNames: 'style.css'
      }
    }
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  }
})
