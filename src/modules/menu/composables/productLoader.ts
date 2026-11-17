export type ProductLoadState = 'idle' | 'loading' | 'error' | 'unavailable'

// A closed card or a new branch invalidates even a transport that ignores abort.
export function createProductLoader<T>(
  fetch: (branch: string, key: string, signal: AbortSignal) => Promise<T>,
  receive: (product: T) => void,
  state: (state: ProductLoadState) => void,
) {
  let generation = 0
  let request: AbortController | null = null
  function cancel() { generation++; request?.abort(); request = null }
  async function load(branch: string, key: string) {
    cancel()
    const version = generation
    const controller = new AbortController()
    request = controller
    state('loading')
    try {
      const product = await fetch(branch, key, controller.signal)
      if (generation !== version || controller.signal.aborted) return
      receive(product)
      state('idle')
    } catch (error) {
      if (generation !== version || controller.signal.aborted) return
      const status = (error as { response?: { status?: number } })?.response?.status
      state(status === 404 || status === 410 ? 'unavailable' : 'error')
    } finally {
      if (version === generation) request = null
    }
  }
  return { load, cancel }
}
