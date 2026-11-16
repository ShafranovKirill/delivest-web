import { expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

it('suppresses push while blocked and after cache read failure', async () => {
  const handlers = new Map<string, (event: unknown) => void>()
  const showNotification = vi.fn(async () => undefined)
  let blocked = true
  let cacheFails = false
  const self = {
    addEventListener: (name: string, callback: (event: unknown) => void) =>
      handlers.set(name, callback),
    registration: { showNotification },
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
  }
  const caches = {
    open: async () => {
      if (cacheFails) throw new Error('Cache unavailable')
      return { match: async () => (blocked ? {} : undefined) }
    },
  }
  const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')
  runInNewContext(source, { self, caches, URL, Boolean })
  const ack = vi.fn()
  handlers.get('message')!({ data: { type: 'delivest-push-block' }, ports: [{ postMessage: ack }] })
  expect(ack).toHaveBeenCalledWith({ type: 'delivest-push-block-ack' })
  async function push() {
    let pending!: Promise<unknown>
    handlers.get('push')!({
      data: { json: () => ({ title: 'Private order' }) },
      waitUntil: (value: Promise<unknown>) => {
        pending = value
      },
    })
    await pending
  }
  await push()
  expect(showNotification).not.toHaveBeenCalled()
  blocked = false
  cacheFails = true
  await push()
  expect(showNotification).not.toHaveBeenCalled()
  cacheFails = false
  handlers.get('message')!({ data: { type: 'delivest-push-unblock' } })
  await push()
  expect(showNotification).toHaveBeenCalledTimes(1)
})
