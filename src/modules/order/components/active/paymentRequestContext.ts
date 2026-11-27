export type PaymentRequestContext = {
  orderId: string
  branchId: string
  sessionEpoch: number
}

export function isCurrentPaymentRequest(
  request: PaymentRequestContext,
  current: PaymentRequestContext | null,
): boolean {
  return Boolean(
    current &&
    request.orderId === current.orderId &&
    request.branchId === current.branchId &&
    request.sessionEpoch === current.sessionEpoch,
  )
}
