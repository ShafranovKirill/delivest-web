import { computed, onScopeDispose, ref, watch } from 'vue'
import type { Channel } from 'phoenix'
import axios from 'axios'
import { getApiErrorCode, getApiErrorMessage } from '@/api/errors'
import { getSocket } from '@/api/socket'
import { t } from '@/i18n'
import { AuthService, type CallConfirmation, type ClientSession } from '../api/auth.service'
import { useAuthStore } from '../stores/auth.store'

type Failure = { code?: string }

const POLL_INTERVAL_MS = 2000
const FINAL_CODES = ['confirmation_not_found', 'client_blocked', 'attempts_exhausted']

export function useCallConfirmation(onConfirmed: (session: ClientSession) => void) {
  const authStore = useAuthStore()
  const confirmation = ref<CallConfirmation | null>(null)
  const isStarting = ref(false)
  const errorMessage = ref<string | null>(null)
  const secondsLeft = ref(0)
  const attemptsLeft = ref<number | null>(null)
  const isChecking = ref(false)

  let channel: Channel | null = null
  let countdownTimer: ReturnType<typeof setInterval> | undefined
  let pollTimer: ReturnType<typeof setTimeout> | undefined
  let checking = false
  let generation = 0

  const isWaiting = computed(() => confirmation.value !== null)

  function waitingFor(confirmationId: string) {
    return confirmation.value?.confirmation_id === confirmationId
  }

  function stop() {
    clearInterval(countdownTimer)
    clearTimeout(pollTimer)
    channel?.leave()
    channel = null
  }

  function reset(message: string | null = null) {
    generation += 1
    stop()
    confirmation.value = null
    secondsLeft.value = 0
    attemptsLeft.value = null
    errorMessage.value = message
    isStarting.value = false
    isChecking.value = false
    checking = false
  }

  function fail({ code }: Failure = {}) {
    reset(t(`errors.codes.${code ?? 'confirmation_not_found'}`))
  }

  function confirm(confirmationId: string, session: ClientSession) {
    if (!waitingFor(confirmationId)) return
    reset()
    onConfirmed(session)
  }

  function startCountdown(seconds: number) {
    const requestGeneration = generation
    secondsLeft.value = seconds
    countdownTimer = setInterval(() => {
      if (requestGeneration !== generation) return
      secondsLeft.value -= 1
      if (secondsLeft.value <= 0) fail()
    }, 1000)
  }

  async function check(confirmationId: string) {
    if (checking || !waitingFor(confirmationId)) return
    const requestGeneration = generation
    checking = true
    try {
      const session = await AuthService.checkCall(confirmationId)
      if (requestGeneration !== generation) return
      if (session.status === 'confirmed') confirm(confirmationId, session)
    } catch (error) {
      if (requestGeneration !== generation) return
      const code = getApiErrorCode(error)
      if (code && FINAL_CODES.includes(code) && waitingFor(confirmationId)) fail({ code })
    } finally {
      if (requestGeneration === generation) checking = false
    }
  }

  function poll(confirmationId: string) {
    const requestGeneration = generation
    pollTimer = setTimeout(async () => {
      if (requestGeneration !== generation) return
      await check(confirmationId)
      if (requestGeneration === generation && waitingFor(confirmationId)) poll(confirmationId)
    }, POLL_INTERVAL_MS)
  }

  function checkOnReturn() {
    const confirmationId = confirmation.value?.confirmation_id
    if (confirmationId && document.visibilityState === 'visible') check(confirmationId)
  }

  async function listen(confirmationId: string) {
    const requestGeneration = generation
    const sessionEpoch = authStore.sessionEpoch
    const isCurrent = () => authStore.sessionEpoch === sessionEpoch
    const socket = await getSocket(sessionEpoch, isCurrent)
    if (requestGeneration !== generation || !waitingFor(confirmationId) || !isCurrent()) return

    channel = socket.channel(`auth:${confirmationId}`)
    channel.on('confirmed', () => check(confirmationId))
    channel.join()
  }

  async function start(phone: string) {
    if (isStarting.value) return

    reset()
    const requestGeneration = generation
    isStarting.value = true
    try {
      const result = await AuthService.startCall(phone)
      if (requestGeneration !== generation) return
      confirmation.value = result
      const { confirmation_id: confirmationId, expires_in: expiresIn } = confirmation.value
      startCountdown(expiresIn)
      poll(confirmationId)
      listen(confirmationId).catch(() => undefined)
    } catch (error) {
      if (requestGeneration === generation) reset(getApiErrorMessage(error))
    } finally {
      if (requestGeneration === generation) isStarting.value = false
    }
  }

  async function submitCode(code: string) {
    const confirmationId = confirmation.value?.confirmation_id
    if (!confirmationId || isChecking.value) return false
    const requestGeneration = generation

    isChecking.value = true
    attemptsLeft.value = null
    try {
      await AuthService.confirmCode(confirmationId, code)
      if (requestGeneration !== generation) return false
      await check(confirmationId)
      return requestGeneration === generation
    } catch (error) {
      if (requestGeneration !== generation) return false
      const failedCode = getApiErrorCode(error)
      if (failedCode === 'invalid_code' && axios.isAxiosError(error)) {
        attemptsLeft.value = error.response?.data?.details?.attempts_left ?? 0
      } else {
        fail({ code: failedCode ?? undefined })
      }
      return false
    } finally {
      if (requestGeneration === generation) isChecking.value = false
    }
  }

  document.addEventListener('visibilitychange', checkOnReturn)
  watch(
    () => authStore.sessionEpoch,
    () => reset(),
    { flush: 'sync' },
  )

  onScopeDispose(() => {
    reset()
    document.removeEventListener('visibilitychange', checkOnReturn)
  })

  return {
    confirmation,
    isStarting,
    isWaiting,
    isChecking,
    errorMessage,
    secondsLeft,
    attemptsLeft,
    start,
    submitCode,
    reset,
  }
}
