export const useImagePlaceholder = () => {
  const placeholder = '/placeholder/product-placeholder.svg'

  const getImageUrl = (url?: string | null) => url || placeholder

  const handleImageError = (event: Event) => {
    const target = event.target as HTMLImageElement
    target.src = placeholder
  }

  return { getImageUrl, handleImageError }
}
