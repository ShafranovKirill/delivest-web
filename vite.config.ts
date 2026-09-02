import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

import { customCollectionsList, customIconCollections } from './src/utils/icons.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ mode }) => {
  const rootDir = path.resolve(__dirname, './')
  const loadedEnv = loadEnv(mode, rootDir)

  return {
    envDir: rootDir,
    envPrefix: 'VITE_',
    server: {
      port: Number(loadedEnv.VITE_PORT_WEB) || 5173,
    },
    plugins: [
      vue(),
      vueDevTools(),
      tailwindcss(),
      Components({
        resolvers: [
          PrimeVueResolver(),
          IconsResolver({
            customCollections: customCollectionsList,
          }),
        ],
      }),
      Icons({
        customCollections: customIconCollections,
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
