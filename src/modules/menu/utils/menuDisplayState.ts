export function menuDisplayState(
  hasData: boolean,
  loading: boolean,
  error: boolean,
  productCount: number,
) {
  if (!hasData && loading) return 'loading'
  if (!hasData && error) return 'error'
  if (!productCount) return 'empty'
  return 'content'
}
