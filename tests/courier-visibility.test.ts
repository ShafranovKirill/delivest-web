import { expect, it } from 'vitest'
import { courierDetailsEnabled } from '../src/modules/order/components/active/courierVisibility'
import type { Branch } from '../src/modules/branch/api/branch.service'

const branch = (id: string, couriers: boolean, yandex: boolean) =>
  ({ id, branch_info: { couriers_enabled: couriers, yandex_delivery_enabled: yandex } }) as Branch

it('uses the order branch capability, even when another branch is selected', () => {
  const orderBranch = branch('order-branch', false, true)
  const selected = branch('selected-branch', true, false)

  expect(courierDetailsEnabled('order-branch', 'staff', [orderBranch, selected], selected)).toBe(
    false,
  )
  expect(courierDetailsEnabled('order-branch', 'yandex', [orderBranch, selected], selected)).toBe(
    true,
  )
  expect(courierDetailsEnabled('selected-branch', 'staff', [orderBranch, selected], selected)).toBe(
    true,
  )
  expect(
    courierDetailsEnabled('selected-branch', 'yandex', [orderBranch, selected], selected),
  ).toBe(false)
  expect(courierDetailsEnabled('missing-branch', 'staff', [selected], selected)).toBe(false)
  expect(courierDetailsEnabled('order-branch', 'yandex', [], orderBranch)).toBe(true)
  expect(courierDetailsEnabled('order-branch', undefined, [orderBranch], selected)).toBe(false)
})
