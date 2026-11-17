import { expect, it } from 'vitest'
import { publicLandingTarget } from '../src/router/publicLanding'

it('restores only a local public target in the explicitly selected branch', () => {
  expect(publicLandingTarget('/center/product/pizza?yclid=123&phone=secret', 'center')).toBe('/center/product/pizza?yclid=123')
  expect(publicLandingTarget('/center?product=uuid&campaign_id=12345678', 'center')).toBe('/center?product=uuid&campaign_id=12345678')
  expect(publicLandingTarget('/center/product/pizza', 'north')).toBeNull()
  expect(publicLandingTarget('//evil.test/center')).toBeNull()
  expect(publicLandingTarget('/center/checkout/order/private-id')).toBeNull()
  expect(publicLandingTarget('/center/addresses')).toBeNull()
})
