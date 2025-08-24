import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

// Plugin to copy codicon.css to dist
const copyCodiconPlugin = () => {
  return {
    name: 'copy-codicon',
    writeBundle() {
      const styleSrcPath = join(__dirname, 'src', 'styles', 'codicon.css')
      const styleDistPath = join(__dirname, 'dist', 'codicon.css')
      const ttfSrcPath = join(__dirname, 'src', 'styles', 'codicon.ttf')
      const ttfDistPath = join(__dirname, 'dist', 'codicon.ttf')
      
      // Ensure dist directory exists
      if (!existsSync(join(__dirname, 'dist'))) {
        mkdirSync(join(__dirname, 'dist'), { recursive: true })
      }
      
      // Copy the file
      try {
        copyFileSync(styleSrcPath, styleDistPath)
        copyFileSync(ttfSrcPath, ttfDistPath)
        console.log('✅ Copied codicon.css and codicon.ttf to dist directory')
      } catch (error) {
        console.error('❌ Failed to copy codicon.css and codicon.ttf:', error)
      }
    }
  }
}

export default defineConfig({
  plugins: [vue(), copyCodiconPlugin()],
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
