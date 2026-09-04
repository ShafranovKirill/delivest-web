export const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 11 && cleaned.startsWith('8')) {
    cleaned = '7' + cleaned.substring(1)
  }

  const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})$/)

  if (match) {
    return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}-${match[5]}`
  }

  return phone
}
