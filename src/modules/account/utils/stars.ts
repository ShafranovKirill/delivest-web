type Rate = { per_rubles?: number | null; stars?: number | null }

export function starsFor(totalKopecks: number, deliveryKopecks: number, rate?: Rate | null) {
  if (!rate?.per_rubles || !rate.stars) return 0
  const base = Math.max(totalKopecks - deliveryKopecks, 0)
  return Math.floor(base / (rate.per_rubles * 100)) * rate.stars
}
