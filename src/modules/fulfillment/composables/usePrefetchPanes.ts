import { onMounted } from 'vue'
import { loadDeliveryPane, loadPickupPane } from '../utils/panes'

function whenIdle(task: () => void) {
  if ('requestIdleCallback' in window) requestIdleCallback(task)
  else setTimeout(task, 2000)
}

function prefetch() {
  Promise.all([loadDeliveryPane(), loadPickupPane()]).catch(() => null)
}

export function usePrefetchPanes() {
  onMounted(() => whenIdle(prefetch))
}
