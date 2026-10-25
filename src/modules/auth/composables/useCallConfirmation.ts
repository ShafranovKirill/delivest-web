import { computed, onScopeDispose, ref } from 'vue'
import type { Channel } from 'phoenix'
import { getApiErrorCode, getApiErrorMessage } from '@/api/errors'
import { getSocket } from '@/api/socket'
import { t } from '@/i18n'
import { AuthService, type CallConfirmation, type ClientSession } from '../api/auth.service'

type Failure = { code?: string }

const POLL_INTERVAL_MS = 2000
const FINAL_CODES = ['confirmation_not_found', 'client_blocked']

export function useCallConfirmation(onConfirmed: (session: ClientSession) => void) {
  const confirmation = ref<CallConfirmation | null>(null)
  const isStarting = ref(false)
  const errorMessage = ref<string | null>(null)
  const secondsLeft = ref(0)

  let channel: Channel | null = null
  let countdownTimer: ReturnType<typeof setInterval> | undefined
  let pollTimer: ReturnType<typeof setTimeout> | undefined
  let checking = false

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
    stop()
    confirmation.value = null
    errorMessage.value = message
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
    secondsLeft.value = seconds
    countdownTimer = setInterval(() => {
      secondsLeft.value -= 1
      if (secondsLeft.value <= 0) fail()
    }, 1000)
  }

  async function check(confirmationId: string) {
    if (checking) return
    checking = true
    try {
      const session = await AuthService.checkCall(confirmationId)
      if (session.status === 'confirmed') confirm(confirmationId, session)
    } catch (error) {
      const code = getApiErrorCode(error)
      if (code && FINAL_CODES.includes(code) && waitingFor(confirmationId)) fail({ code })
    } finally {
      checking = false
    }
  }

  function poll(confirmationId: string) {
    pollTimer = setTimeout(async () => {
      await check(confirmationId)
      if (waitingFor(confirmationId)) poll(confirmationId)
    }, POLL_INTERVAL_MS)
  }

  function checkOnReturn() {
    const confirmationId = confirmation.value?.confirmation_id
    if (confirmationId && document.visibilityState === 'visible') check(confirmationId)
  }

  async function listen(confirmationId: string) {
    const socket = await getSocket()
    if (!waitingFor(confirmationId)) return

    channel = socket.channel(`auth:${confirmationId}`)
    channel.on('confirmed', () => check(confirmationId))
    channel.join()
  }

  async function start(phone: string) {
    if (isStarting.value) return

    reset()
    isStarting.value = true
    try {
      confirmation.value = await AuthService.startCall(phone)
      const { confirmation_id: confirmationId, expires_in: expiresIn } = confirmation.value
      startCountdown(expiresIn)
      poll(confirmationId)
      listen(confirmationId).catch(() => undefined)
    } catch (error) {
      reset(getApiErrorMessage(error))
    } finally {
      isStarting.value = false
    }
  }

  document.addEventListener('visibilitychange', checkOnReturn)

  onScopeDispose(() => {
    stop()
    document.removeEventListener('visibilitychange', checkOnReturn)
  })

  return { confirmation, isStarting, isWaiting, errorMessage, secondsLeft, start, reset }
}
