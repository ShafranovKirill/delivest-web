const streetPrefix =
  /^(?:ул\.?|улица|пр\.?|проспект|пер\.?|переулок|шоссе|бульвар|б-р|проезд|наб\.?|набережная)\s/i
const houseSuffix = /(?:\s+(?:к\.?|корп\.?|корпус|стр\.?|строение)\s*\d+[а-яa-z]?)*/i
const houseNumber = '\\d+(?:к\\d+[а-яa-z]?|[а-яa-z])?(?:[/-]\\d+[а-яa-z]?)?'
const explicitHouse = new RegExp(
  `(?:^|[,\\s])д(?:ом)?\\.?\\s*(${houseNumber}${houseSuffix.source})\\s*$`,
  'i',
)
const trailingHouse = new RegExp(`(?:^|[,\\s])(${houseNumber}${houseSuffix.source})\\s*$`, 'i')

export function parseAddress(value: string, branchCity: string) {
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  let city = ''

  if (branchCity && parts[0]?.toLowerCase().startsWith(`${branchCity.toLowerCase()} `)) {
    parts[0] = parts[0]!.slice(branchCity.length).trim()
    city = branchCity
  }

  if (
    parts.length > 1 &&
    (/^г\.?\s/i.test(parts[0]!) ||
      parts[0]!.toLowerCase() === branchCity.toLowerCase() ||
      (parts.length > 2 && !streetPrefix.test(parts[0]!) && !/^\d/.test(parts[1]!)) ||
      (parts.length === 2 &&
        !streetPrefix.test(parts[0]!) &&
        (streetPrefix.test(parts[1]!) ||
          /^(?!д(?:ом)?\.?\s*\d)[а-яa-z].*\s\d+(?:к\d+|[а-яa-z])?$/i.test(parts[1]!))))
  ) {
    city = parts.shift()!.replace(/^г\.?\s*/i, '')
  }

  const line = parts
    .join(', ')
    .replace(/,\s*((?:к\.?|корп\.?|корпус|стр\.?|строение)\s*\d+[а-яa-z]?)/gi, ' $1')
  const match = line.match(explicitHouse) ?? line.match(trailingHouse)
  return {
    city,
    street: match ? line.slice(0, match.index).replace(/[\s,]+$/, '') : line,
    house: match?.[1]?.replace(/\s+/g, ' ').trim() ?? '',
  }
}
