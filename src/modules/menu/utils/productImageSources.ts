export type PhotoVariant = { url: string; width: number }

// Invalid or absent metadata must never prevent the legacy photo_url from loading.
export function productImageSrcset(variants?: PhotoVariant[] | null): string | undefined {
  const valid = variants?.filter(
    (v) => Number.isSafeInteger(v.width) && v.width > 0 && v.url && !/[\s,]/.test(v.url),
  )
  return valid?.length
    ? [...new Map(valid.map((v) => [v.width, v])).values()]
        .sort((a, b) => a.width - b.width)
        .map((v) => `${v.url} ${v.width}w`)
        .join(', ')
    : undefined
}

// Matches the auto-fill grid's 160px/230px minimums and the 1280px container.
export const CARD_IMAGE_SIZES =
  '(min-width: 1280px) 227px, (min-width: 1214px) calc((100vw - 64px) / 5 - 16px), (min-width: 976px) calc((100vw - 56px) / 4 - 16px), (min-width: 738px) calc((100vw - 48px) / 3 - 16px), (min-width: 640px) calc((100vw - 40px) / 2 - 16px), (min-width: 340px) calc((100vw - 20px) / 2 - 16px), calc(100vw - 32px)'
