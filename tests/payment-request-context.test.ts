import { describe, expect, it } from 'vitest'
import { isCurrentPaymentRequest } from '@/modules/order/components/active/paymentRequestContext'

describe('active order payment response context', () => {
  const request = { orderId: 'order-a', branchId: 'branch-a', sessionEpoch: 4 }

  it('allows a response only for the same open order, branch and auth session', () => {
    expect(isCurrentPaymentRequest(request, { ...request })).toBe(true)
    expect(isCurrentPaymentRequest(request, null)).toBe(false)
    expect(isCurrentPaymentRequest(request, { ...request, orderId: 'order-b' })).toBe(false)
    expect(isCurrentPaymentRequest(request, { ...request, branchId: 'branch-b' })).toBe(false)
    expect(isCurrentPaymentRequest(request, { ...request, sessionEpoch: 5 })).toBe(false)
  })
})
