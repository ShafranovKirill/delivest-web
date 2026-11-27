import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

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

export default defineConfig(async ({ mode }) => {
  const rootDir = path.resolve(__dirname, './')
  const loadedEnv = loadEnv(mode, rootDir)
  const analyze = process.env.ANALYZE_BUNDLE === '1'
  const analysisPlugins = []
  if (analyze) {
    const analysisRequire = createRequire(path.join(rootDir, 'tools/bundle-analysis/package.json'))
    const { visualizer } = await import(
      pathToFileURL(analysisRequire.resolve('rollup-plugin-visualizer')).href
    )
    analysisPlugins.push(
      visualizer({
        filename: path.join(rootDir, 'artifacts/bundle/report.html'),
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
      }),
      visualizer({
        filename: path.join(rootDir, 'artifacts/bundle/report.json'),
        template: 'raw-data',
        gzipSize: true,
        brotliSize: true,
      }),
    )
  }

  return {
    envDir: rootDir,
    envPrefix: 'VITE_',
    server: {
      port: Number(loadedEnv.VITE_PORT_WEB) || 3000,
    },
    build: { manifest: analyze },
    plugins: [
      vue(),
      loadedEnv.VITE_DEVTOOLS !== 'false' && vueDevTools(),
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
      ...analysisPlugins,
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
