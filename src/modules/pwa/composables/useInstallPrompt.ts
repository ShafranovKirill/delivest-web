import { computed, ref } from 'vue'
import { isIos, isStandalone } from '../utils/platform'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const deferred = ref<InstallPromptEvent | null>(null)
const installed = ref(false)

export function listenForInstallPrompt() {
  installed.value = isStandalone()

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred.value = event as InstallPromptEvent
  })

  window.addEventListener('appinstalled', () => {
    installed.value = true
    deferred.value = null
  })
}

export function useInstallPrompt() {
  const needsGuide = computed(() => !installed.value && isIos())
  const canInstall = computed(
    () => !installed.value && (deferred.value !== null || needsGuide.value),
  )

  async function promptInstall() {
    const event = deferred.value
    if (!event) return
    await event.prompt()
    const { outcome } = await event.userChoice
    if (outcome === 'accepted') deferred.value = null
  }

  return { canInstall, needsGuide, promptInstall }
}
