import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { queryClient } from '@/api/client'
import type { ClientProfile, ClientSession } from '../api/auth.service'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const accessToken = ref<string | null>(null)
    const refreshToken = ref<string | null>(null)
    const client = ref<ClientProfile | null>(null)
    const lastPhone = ref<string | null>(null)
    const isModalOpen = ref(false)

    const isAuthenticated = computed(() => Boolean(refreshToken.value && client.value))

    function setSession(session: ClientSession) {
      accessToken.value = session.access_token ?? null
      refreshToken.value = session.refresh_token ?? null
      client.value = session.client ?? null
      if (session.client?.phone) lastPhone.value = session.client.phone
    }

    function signIn(session: ClientSession) {
      setSession(session)
      queryClient.invalidateQueries()
    }

    function logout() {
      accessToken.value = null
      refreshToken.value = null
      client.value = null
      queryClient.invalidateQueries()
    }

    function openModal() {
      isModalOpen.value = true
    }

    function closeModal() {
      isModalOpen.value = false
    }

    return {
      accessToken,
      refreshToken,
      client,
      lastPhone,
      isModalOpen,
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
