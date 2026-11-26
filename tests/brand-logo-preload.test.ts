import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { hasFailedBrandLogo, preloadBrandLogo } from '../src/modules/franchise/utils/brandLogoPreload'

function deferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

class TestImage {
  static instances: TestImage[] = []
  static cached = false
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  loading = ''
  fetchPriority = ''
  decoding = ''
  complete = false
  naturalWidth = 0
  source = ''
  decoded = deferred()

  constructor() {
    TestImage.instances.push(this)
  }

  set src(value: string) {
    this.source = value
    if (TestImage.cached) {
      this.complete = true
      this.naturalWidth = 100
    }
  }

  decode() {
    return this.decoded.promise
  }

  load() {
    this.complete = true
    this.naturalWidth = 100
    this.onload?.()
  }

  error() {
    this.complete = true
    this.onerror?.()
  }
}

beforeEach(() => {
  TestImage.instances = []
  TestImage.cached = false
  vi.stubGlobal('Image', TestImage)
})

afterEach(() => vi.unstubAllGlobals())

it('keeps startup pending until the requested logo loads and decodes', async () => {
  const ready = preloadBrandLogo('/logo-loading.png')
  const image = TestImage.instances[0]!
  const settled = vi.fn()
  void ready.then(settled)

  expect(image.source).toBe('/logo-loading.png')
  expect(image.loading).toBe('eager')
  expect(image.fetchPriority).toBe('high')
  await Promise.resolve()
  expect(settled).not.toHaveBeenCalled()

  image.load()
  await Promise.resolve()
  expect(settled).not.toHaveBeenCalled()

  image.decoded.resolve()
  await ready
  expect(settled).toHaveBeenCalledOnce()
  expect(hasFailedBrandLogo('/logo-loading.png')).toBe(false)
})

it('decodes a cached image before finishing', async () => {
  TestImage.cached = true
  const ready = preloadBrandLogo('/logo-cached.png')
  const image = TestImage.instances[0]!
  const settled = vi.fn()
  void ready.then(settled)
  await Promise.resolve()
  expect(settled).not.toHaveBeenCalled()
  image.decoded.resolve()
  await ready
  expect(settled).toHaveBeenCalledOnce()
})

it('finishes immediately when there is no logo URL', async () => {
  await preloadBrandLogo(null)
  expect(TestImage.instances).toHaveLength(0)
})

it('finishes with a text fallback when the image request fails', async () => {
  const ready = preloadBrandLogo('/logo-broken.png')
  TestImage.instances[0]!.error()
  await ready
  expect(hasFailedBrandLogo('/logo-broken.png')).toBe(true)
})

it('finishes with a text fallback when decoding fails', async () => {
  const ready = preloadBrandLogo('/logo-decode-failed.png')
  const image = TestImage.instances[0]!
  image.load()
  image.decoded.reject(new Error('Unable to decode image'))
  await ready
  expect(hasFailedBrandLogo('/logo-decode-failed.png')).toBe(true)
})
