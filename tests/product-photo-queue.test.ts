import { describe, expect, it, vi } from 'vitest'
import { ProductPhotoQueue } from '../src/modules/menu/utils/productPhotoQueue'

function harness() {
  const frames = new Map<number, FrameRequestCallback>()
  let nextFrame = 0
  const queue = new ProductPhotoQueue(
    (callback) => {
      frames.set(++nextFrame, callback)
      return nextFrame
    },
    (id) => {
      frames.delete(id)
    },
    () => ({ width: 390, height: 844 }),
  )
  const flush = () => {
    const pending = [...frames.values()]
    frames.clear()
    pending.forEach((callback) => callback(0))
  }
  const add = (name: string, top: number, signature = name, near = false) => {
    const element = {
      getBoundingClientRect: () => ({ left: 0, right: 169, top, bottom: top + 169 }),
    } as HTMLElement
    const activate = vi.fn()
    const revoke = vi.fn()
    const handle = queue.register(element, signature, near, activate, revoke)
    return { handle, activate, revoke }
  }
  return { queue, flush, add }
}

describe('product photo queue', () => {
  it('waits for every visible photo, then allows only two unsettled background images', () => {
    const { flush, add } = harness()
    const visibleA = add('visible-a', 0)
    const visibleB = add('visible-b', 200)
    const farA = add('far-a', 1200)
    const farB = add('far-b', 1400)
    const farC = add('far-c', 1600)

    flush()
    expect(visibleA.activate).toHaveBeenCalledWith('visible')
    expect(visibleB.activate).toHaveBeenCalledWith('visible')
    expect(farA.activate).not.toHaveBeenCalled()
    visibleA.handle.settle()
    flush()
    expect(farA.activate).not.toHaveBeenCalled()
    visibleB.handle.settle()
    flush()
    expect(farA.activate).toHaveBeenCalledWith('background')
    expect(farB.activate).toHaveBeenCalledWith('background')
    expect(farC.activate).not.toHaveBeenCalled()

    farA.handle.settle()
    flush()
    expect(farC.activate).toHaveBeenCalledWith('background')
  })

  it('keeps a background slot through variant fallback until final load or error', () => {
    const { flush, add } = harness()
    const first = add('first', 1200)
    const second = add('second', 1400)
    const third = add('third', 1600)
    flush()
    expect(first.activate).toHaveBeenCalledWith('background')
    expect(second.activate).toHaveBeenCalledWith('background')
    // A responsive candidate error changes the img srcset to the legacy URL;
    // ProductImage calls settle only after that URL loads or also fails.
    flush()
    expect(third.activate).not.toHaveBeenCalled()
    first.handle.settle()
    flush()
    expect(third.activate).toHaveBeenCalledWith('background')
  })

  it('releases stale slots on source change or unmount without revoking completed photos', () => {
    const { flush, add } = harness()
    const first = add('first', 1200)
    const second = add('second', 1400)
    const third = add('third', 1600)
    flush()
    first.handle.update('replacement', false)
    expect(first.revoke).toHaveBeenCalledOnce()
    second.handle.remove()
    expect(second.revoke).toHaveBeenCalledOnce()
    flush()
    expect(first.activate).toHaveBeenLastCalledWith('background')
    expect(third.activate).toHaveBeenCalledWith('background')
    first.handle.settle()
    first.handle.remove()
    expect(first.revoke).toHaveBeenCalledOnce()
  })

  it('pauses old background work across a scope reset while retaining registered cards', () => {
    const { queue, flush, add } = harness()
    const first = add('first', 1200)
    const second = add('second', 1400)
    const third = add('third', 1600)
    flush()
    queue.reset()
    expect(first.revoke).toHaveBeenCalledOnce()
    expect(second.revoke).toHaveBeenCalledOnce()
    first.handle.settle() // A late event from the previous branch must not start more work.
    flush()
    expect(third.activate).not.toHaveBeenCalled()
    third.handle.remove()
    queue.resume()
    flush()
    expect(third.activate).not.toHaveBeenCalled()
  })

  it('promotes a newly visible background photo and holds new background grants', () => {
    const { queue, flush, add } = harness()
    const first = add('first', 1200)
    const second = add('second', 1400)
    const third = add('third', 1600)
    flush()
    // A near callback promotes the active photo to ordinary priority.
    first.handle.setNear(true)
    flush()
    expect(first.activate).toHaveBeenLastCalledWith('visible')
    expect(third.activate).toHaveBeenCalledWith('background')
    // New visible work prevents the next queued far image from starting.
    const visible = add('new-visible', 0)
    const fourth = add('fourth', 1800)
    queue.viewportChanged()
    flush()
    expect(visible.activate).toHaveBeenCalledWith('visible')
    second.handle.settle()
    third.handle.settle()
    flush()
    expect(fourth.activate).not.toHaveBeenCalled()
    visible.handle.settle()
    flush()
    expect(fourth.activate).toHaveBeenCalledWith('background')
  })

  it('ignores cards without a photo while scheduling later images', () => {
    const { flush, add } = harness()
    const empty = add('empty', 0, '')
    const far = add('far', 1200)
    flush()
    expect(empty.activate).not.toHaveBeenCalled()
    expect(far.activate).toHaveBeenCalledWith('background')
  })

  it('uses a horizontal strip boundary and waits before background grants', () => {
    const { queue, flush, add } = harness()
    queue.setBackgroundEnabled(false)
    const first = add('first', 0)
    const far = add('far', 1200)
    const clipped = {
      getBoundingClientRect: () => ({ left: 500, right: 640, top: 0, bottom: 192 }),
    } as HTMLElement
    const activate = vi.fn()
    const handle = queue.register(clipped, 'story-cover', false, activate, vi.fn(), () => false)
    flush()
    expect(first.activate).toHaveBeenCalledWith('visible')
    expect(activate).not.toHaveBeenCalled()
    first.handle.settle()
    queue.setBackgroundEnabled(true)
    flush()
    expect(far.activate).toHaveBeenCalledWith('background')
    expect(activate).toHaveBeenCalledWith('background')
    handle.remove()
  })

  it('warms the modal only once visible photos settle', () => {
    const { queue, flush, add } = harness()
    const ready = vi.fn()
    const first = add('first', 0)
    queue.whenVisibleReady(ready)
    flush()
    expect(ready).not.toHaveBeenCalled()
    first.handle.settle()
    flush()
    expect(ready).toHaveBeenCalledOnce()
    queue.viewportChanged()
    flush()
    expect(ready).toHaveBeenCalledOnce()
  })
})
