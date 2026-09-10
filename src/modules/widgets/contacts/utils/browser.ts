export const openLink = (url: string | undefined, target: '_blank' | '_self' = '_blank') => {
  if (url) {
    window.open(url, target)
  }
}
