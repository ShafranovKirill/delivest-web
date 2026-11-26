import { reactive } from 'vue'

const failedUrls = reactive(new Set<string>())

export function hasFailedBrandLogo(url: string): boolean {
  return failedUrls.has(url)
}

export function markBrandLogoFailed(url: string): void {
  failedUrls.add(url)
}

export async function preloadBrandLogo(url: string | null | undefined): Promise<void> {
  if (!url) return

  const image = new Image()
  image.loading = 'eager'
  image.fetchPriority = 'high'
  image.decoding = 'async'

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Brand logo failed to load'))
      image.src = url

      if (image.complete) {
        if (image.naturalWidth > 0) resolve()
        else reject(new Error('Brand logo failed to load'))
      }
    })
    await image.decode?.()
    failedUrls.delete(url)
  } catch {
    markBrandLogoFailed(url)
  } finally {
    image.onload = null
    image.onerror = null
  }
}
