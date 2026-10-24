import { ref, watch, type Ref } from 'vue'
import { useRafFn } from '@vueuse/core'

export function useStoryPlayer(ready: Ref<boolean>, duration: number, onEnd: () => void) {
  const progress = ref(0)
  const held = ref(false)

  const { pause, resume } = useRafFn(
    ({ delta }) => {
      progress.value = Math.min(1, progress.value + delta / duration)
      if (progress.value >= 1) onEnd()
    },
    { immediate: false },
  )

  watch([ready, held], ([isReady, isHeld]) => (isReady && !isHeld ? resume() : pause()), {
    immediate: true,
  })

  function restart() {
    progress.value = 0
  }

  return { progress, held, restart }
}
