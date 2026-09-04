import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import 'primeicons/primeicons.css'
import PrimeVue from 'primevue/config'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryClient } from './api/client.ts'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { ToastService } from 'primevue'
import { MyPreset } from './assets/colorPreset.ts'

const app = createApp(App)
const pinia = createPinia()

app.use(PrimeVue, {
  theme: {
    preset: MyPreset,
    options: {
      prefix: 'p',
      darkModeSelector: 'light',
      cssLayer: false,
    },
  },
})

app.use(router)
app.use(VueQueryPlugin, { queryClient })
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(ToastService)

app.mount('#app')
