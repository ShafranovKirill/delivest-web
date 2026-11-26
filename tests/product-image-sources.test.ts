import { describe, expect, it } from 'vitest'
import { CARD_IMAGE_SIZES, productImageSrcset } from '../src/modules/menu/utils/productImageSources'
import { effectScope, ref } from 'vue'
import { useProductImageState } from '../src/modules/menu/composables/useProductImageState'

describe('product image sources', () => {
  it('keeps legacy photo_url as the only source when variants are absent or invalid', () => {
    expect(productImageSrcset()).toBeUndefined()
    expect(productImageSrcset([])).toBeUndefined()
    expect(
      productImageSrcset([
        { url: '', width: 200 },
        { url: '/photo.webp', width: 0 },
      ]),
    ).toBeUndefined()
  })

  it('uses actual widths, removes duplicates and sorts candidates for srcset', () => {
    expect(
      productImageSrcset([
        { url: '/large.webp', width: 960 },
        { url: '/small.webp', width: 320 },
        { url: '/replace.webp', width: 320 },
      ]),
    ).toBe('/replace.webp 320w, /large.webp 960w')
  })

  it('accounts for the single column at 320px and two columns at 390px', () => {
    expect(CARD_IMAGE_SIZES).toContain('(min-width: 340px) calc((100vw - 20px) / 2 - 16px)')
    expect(CARD_IMAGE_SIZES).toContain('calc(100vw - 32px)')
  })
})

describe('image loading and fallback', () => {
  it('does not request a responsive candidate until its photo is near the viewport', () => {
    const scope = effectScope()
    scope.run(() => {
      const photo = ref('/original.jpg')
      const near = ref<string | undefined>()
      const variants = ref([{ url: '/small.webp', width: 320 }])
      const image = useProductImageState(photo, variants, near)
      expect(image.srcset.value).toBeUndefined()
      near.value = photo.value
      expect(image.srcset.value).toBe('/small.webp 320w')
      image.state.value = 'loaded'
      variants.value = [{ url: '/small.webp', width: 320 }]
      expect(image.state.value).toBe('loaded')
      variants.value = [{ url: '/medium.webp', width: 640 }]
      expect(image.state.value).toBe('loaded')
      photo.value = '/next.jpg'
      expect(image.state.value).toBe('loading')
    })
    scope.stop()
  })

  it('falls back to the original after a variant error and keeps the empty/error placeholder', () => {
    const scope = effectScope()
    scope.run(() => {
      const photo = ref<string | null>('/original.jpg')
      const near = ref<string | undefined>('/original.jpg')
      const variants = ref([{ url: '/small.webp', width: 320 }])
      const image = useProductImageState(photo, variants, near)
      image.onError()
      expect(image.srcset.value).toBeUndefined()
      expect(image.hasPhoto.value).toBe(true)
      image.onError()
      expect(image.state.value).toBe('failed')
      photo.value = null
      expect(image.state.value).toBe('loading')
      expect(image.hasPhoto.value).toBe(false)
    })
    scope.stop()
  })
})
