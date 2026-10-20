import { computed, onScopeDispose, ref } from 'vue'
import { getApiErrorMessage } from '@/api/errors'
import { AuthService, type CallConfirmation, type ClientSession } from '../api/auth.service'

const POLL_INTERVAL = 2500

export function useCallConfirmation(onConfirmed: (session: ClientSession) => void) {
  const confirmation = ref<CallConfirmation | null>(null)
  const isStarting = ref(false)
  const errorMessage = ref<string | null>(null)
  const secondsLeft = ref(0)

  let pollTimer: ReturnType<typeof setTimeout> | undefined
  let countdownTimer: ReturnType<typeof setInterval> | undefined

  const isWaiting = computed(() => confirmation.value !== null)

  function stop() {
    clearTimeout(pollTimer)
    clearInterval(countdownTimer)
  }

  function reset(message: string | null = null) {
    stop()
    confirmation.value = null
    errorMessage.value = message
  }

  function startCountdown(seconds: number) {
    secondsLeft.value = seconds
    countdownTimer = setInterval(() => {
      secondsLeft.value -= 1
      if (secondsLeft.value <= 0) reset('Время подтверждения истекло. Попробуйте ещё раз')
    }, 1000)
  }

  async function poll(confirmationId: string) {
    try {
      const session = await AuthService.completeCall(confirmationId)
      if (session.status === 'confirmed') {
        reset()
        onConfirmed(session)
        return
      }
    } catch (error) {
      reset(getApiErrorMessage(error))
      return
    }

    if (confirmation.value?.confirmation_id === confirmationId) schedulePoll(confirmationId)
  }

  function schedulePoll(confirmationId: string) {
    pollTimer = setTimeout(() => poll(confirmationId), POLL_INTERVAL)
  }

  async function start(phone: string) {
    if (isStarting.value) return

    reset()
    isStarting.value = true
    try {
      confirmation.value = await AuthService.startCall(phone)
      startCountdown(confirmation.value.expires_in)
      schedulePoll(confirmation.value.confirmation_id)
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error)
    } finally {
      isStarting.value = false
    }
  }

  onScopeDispose(stop)

  return { confirmation, isStarting, isWaiting, errorMessage, secondsLeft, start, reset }
}
