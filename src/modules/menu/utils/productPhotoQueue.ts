import type { InjectionKey } from 'vue'

type Activation = 'visible' | 'background'
type Entry = {
  element: HTMLElement
  signature: string
  near: boolean
  activated: boolean
  settled: boolean
  background: boolean
  activate: (kind: Activation) => void
  revoke: () => void
}

export type ProductPhotoHandle = {
  update: (signature: string, near: boolean) => void
  setNear: (near: boolean) => void
  settle: () => void
  remove: () => void
}

export class ProductPhotoQueue {
  private entries = new Set<Entry>()
  private frame = 0
  private paused = false
  private disposed = false

  constructor(
    private requestFrame: (callback: FrameRequestCallback) => number = callback => window.requestAnimationFrame(callback),
    private cancelFrame: (handle: number) => void = handle => window.cancelAnimationFrame(handle),
    private viewport: () => { width: number; height: number } = () => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }),
  ) {}

  register(
    element: HTMLElement,
    signature: string,
    near: boolean,
    activate: Entry['activate'],
    revoke: Entry['revoke'],
  ): ProductPhotoHandle {
    const entry: Entry = {
      element, signature, near, activated: near && Boolean(signature),
      settled: !signature, background: false, activate, revoke,
    }
    this.entries.add(entry)
    this.schedule()
    return {
      update: (next, isNear) => {
        if (!this.entries.has(entry)) return
        if (entry.signature !== next) {
          if (entry.background) entry.revoke()
          entry.signature = next
          entry.activated = isNear && Boolean(next)
          entry.settled = !next
          entry.background = false
        }
        entry.near = isNear
        this.schedule()
      },
      setNear: isNear => {
        if (!this.entries.has(entry)) return
        entry.near = isNear
        if (isNear && entry.signature) {
          entry.activated = true
          if (entry.background) {
            entry.background = false
            entry.activate('visible')
          }
        }
        this.schedule()
      },
      settle: () => {
        if (!this.entries.has(entry)) return
        entry.settled = true
        entry.background = false
        this.schedule()
      },
      remove: () => {
        if (!this.entries.delete(entry)) return
        if (entry.background) entry.revoke()
        this.schedule()
      },
    }
  }

  reset() {
    this.paused = true
    for (const entry of this.entries) {
      if (entry.background && !entry.settled) {
        entry.revoke()
        entry.activated = entry.near
      }
      entry.background = false
    }
  }

  resume() { this.paused = false; this.schedule() }
  viewportChanged() { this.schedule() }

  dispose() {
    this.disposed = true
    if (this.frame) this.cancelFrame(this.frame)
    this.frame = 0
    for (const entry of this.entries) if (entry.background) entry.revoke()
    this.entries.clear()
  }

  private schedule() {
    if (this.disposed || this.paused || this.frame) return
    this.frame = this.requestFrame(() => { this.frame = 0; this.reconcile() })
  }

  private reconcile() {
    if (this.paused || this.disposed) return
    const viewport = this.viewport()
    const visible = (entry: Entry) => {
      const rect = entry.element.getBoundingClientRect()
      return rect.bottom > 0 && rect.top < viewport.height &&
        rect.right > 0 && rect.left < viewport.width
    }
    let visiblePending = false
    for (const entry of this.entries) {
      if (!entry.signature || !visible(entry)) continue
      if (!entry.activated || entry.background) {
        entry.activated = true
        entry.background = false
        entry.activate('visible')
      }
      if (!entry.settled) visiblePending = true
    }
    if (visiblePending) return

    let slots = 2 - [...this.entries].filter(entry => entry.background && !entry.settled).length
    for (const entry of this.entries) {
      if (slots === 0) break
      if (!entry.signature || entry.activated || entry.near || entry.settled) continue
      entry.activated = true
      entry.background = true
      entry.activate('background')
      slots--
    }
  }
}

export const productPhotoQueueKey: InjectionKey<ProductPhotoQueue> = Symbol('productPhotoQueue')
