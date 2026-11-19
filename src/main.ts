import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@vueuse/head'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import 'primeicons/primeicons.css'
import PrimeVue from 'primevue/config'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { api, queryClient } from './api/client.ts'
import { installAuthInterceptor } from './modules/auth/api/auth.interceptor.ts'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ToastService from 'primevue/toastservice'
import { MyPreset } from './assets/colorPreset.ts'
import { i18n } from './i18n'
import { useFranchiseStore } from './modules/franchise/stores/franchise.store'
import { registerServiceWorker } from './modules/pwa/registerServiceWorker'
import { watch } from 'vue'
import { useAuthStore } from './modules/auth/stores/auth.store'
import { primeSession } from './router/primeSession'

const app = createApp(App)
const pinia = createPinia()
const head = createHead()

app.use(PrimeVue, {
  theme: {
    preset: MyPreset,
    options: {
      prefix: 'p',
      darkModeSelector: '.dark',
      cssLayer: false,
    },
  },
})

app.use(i18n)
app.use(router)
app.use(head)
app.use(VueQueryPlugin, { queryClient })
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(ToastService)
installAuthInterceptor(api)
registerServiceWorker()
const auth = useAuthStore(pinia)
watch(() => [auth.sessionEpoch, auth.client?.id, auth.accessToken, auth.sessionChanging], () => {
  if (!auth.sessionChanging) primeSession()
}, { flush: 'sync' })

void router.isReady().then(async () => {
  if (!useFranchiseStore(pinia).franchise) await useFranchiseStore(pinia).init()
}).catch(error => console.error('[Storefront] Route initialization failed:', error))
  .finally(() => app.mount('#app'))
