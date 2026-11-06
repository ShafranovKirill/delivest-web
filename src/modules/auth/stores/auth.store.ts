import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { queryClient } from '@/api/client'
import type { ClientProfile, ClientSession } from '../api/auth.service'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import { clearPrivateQueries } from '../private-query-cache'
import { beginPushIdentityChange } from '@/modules/pwa/utils/subscription'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const accessToken = ref<string | null>(null)
    const refreshToken = ref<string | null>(null)
    const client = ref<ClientProfile | null>(null)
    const sessionEpoch = ref(0)
    const lastPhone = ref<string | null>(null)
    const isModalOpen = ref(false)
    const isProfileOpen = ref(false)
    const pushCleanupError = ref(false)
    const franchiseStore = useFranchiseStore()

    const isEnabled = computed(() => franchiseStore.clientAuth)
    const isRequired = computed(() => franchiseStore.clientAuthRequired)
    const isAuthenticated = computed(() =>
      Boolean(isEnabled.value && refreshToken.value && client.value),
    )

    function setSession(session: ClientSession) {
      accessToken.value = session.access_token ?? null
      refreshToken.value = session.refresh_token ?? null
      client.value = session.client ?? null
      if (session.client?.phone) lastPhone.value = session.client.phone
    }

    async function signIn(session: ClientSession) {
      const previousId = client.value?.id
      clearPrivateQueries(queryClient, client.value?.id)
      sessionEpoch.value++
      const epoch = sessionEpoch.value
      if (previousId && previousId !== session.client?.id) {
        try {
          await beginPushIdentityChange(accessToken.value, () => {
            pushCleanupError.value = true
          })
        } catch {
          pushCleanupError.value = true
          throw new Error('Push identity protection failed')
        }
      }
      if (epoch !== sessionEpoch.value) return
      setSession(session)
      queryClient.invalidateQueries()
    }

    async function logout() {
      clearPrivateQueries(queryClient, client.value?.id)
      sessionEpoch.value++
      const epoch = sessionEpoch.value
      if (client.value) {
        try {
          await beginPushIdentityChange(accessToken.value, () => {
            pushCleanupError.value = true
          })
        } catch {
          pushCleanupError.value = true
          return
        }
      }
      if (epoch !== sessionEpoch.value) return
      isProfileOpen.value = false
      accessToken.value = null
      refreshToken.value = null
      client.value = null
      queryClient.invalidateQueries()
    }

    watch(isAuthenticated, (signedIn) => {
      if (!signedIn) isProfileOpen.value = false
    })

    function openProfile() {
      if (isAuthenticated.value) isProfileOpen.value = true
    }

    function closeProfile() {
      isProfileOpen.value = false
    }

    function openModal() {
      if (isEnabled.value) isModalOpen.value = true
    }

    watch(
      isEnabled,
      (enabled) => {
        if (!enabled && refreshToken.value) logout()
      },
      { immediate: true },
    )

    function closeModal() {
      isModalOpen.value = false
    }

    return {
      accessToken,
      refreshToken,
      client,
      sessionEpoch,
      lastPhone,
      isModalOpen,
      isProfileOpen,
      pushCleanupError,
      openProfile,
      closeProfile,
      isEnabled,
      isRequired,
      isAuthenticated,
      setSession,
      signIn,
      logout,
      openModal,
      closeModal,
    }
  },
  { persist: { pick: ['accessToken', 'refreshToken', 'client', 'lastPhone'] } },
)
