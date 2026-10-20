import { computed, onScopeDispose, ref } from 'vue'
import type { Channel } from 'phoenix'
import { getApiErrorMessage } from '@/api/errors'
import { getSocket } from '@/api/socket'
import { t } from '@/i18n'
import { AuthService, type CallConfirmation, type ClientSession } from '../api/auth.service'

type Failure = { code?: string }

export function useCallConfirmation(onConfirmed: (session: ClientSession) => void) {
  const confirmation = ref<CallConfirmation | null>(null)
  const isStarting = ref(false)
  const errorMessage = ref<string | null>(null)
  const secondsLeft = ref(0)

  let channel: Channel | null = null
  let countdownTimer: ReturnType<typeof setInterval> | undefined

  const isWaiting = computed(() => confirmation.value !== null)

  function stop() {
    clearInterval(countdownTimer)
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

  function startCountdown(seconds: number) {
    secondsLeft.value = seconds
    countdownTimer = setInterval(() => {
      secondsLeft.value -= 1
      if (secondsLeft.value <= 0) fail()
    }, 1000)
  }

  async function listen(confirmationId: string) {
    const socket = await getSocket()
    if (confirmation.value?.confirmation_id !== confirmationId) return

    channel = socket.channel(`auth:${confirmationId}`)
    channel.on('confirmed', (session: ClientSession) => {
      reset()
      onConfirmed(session)
    })
    channel.on('failed', fail)
    channel.join().receive('error', fail)
  }

  async function start(phone: string) {
    if (isStarting.value) return

    reset()
    isStarting.value = true
    try {
      confirmation.value = await AuthService.startCall(phone)
      startCountdown(confirmation.value.expires_in)
      await listen(confirmation.value.confirmation_id)
    } catch (error) {
      reset(getApiErrorMessage(error))
    } finally {
      isStarting.value = false
    }
  }

  onScopeDispose(stop)

  return { confirmation, isStarting, isWaiting, errorMessage, secondsLeft, start, reset }
}
