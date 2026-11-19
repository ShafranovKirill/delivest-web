import { Socket } from 'phoenix'
import { api } from '@/api/client'
import { getApiBaseUrl } from '@/utils/env'
import { createEpochCommitGuard } from '@/modules/auth/api/auth-session.js'
import { pendingPrivateSessionForEpoch } from './storefront'

type TokenResponse = { data: { token: string } }

const LONG_POLL_FALLBACK_MS = 2500

let socket: Socket | null = null
let token: string | null = null
let pending: { epoch: number; promise: Promise<Socket> } | null = null
let socketTokenEpoch: number | null = null
let latestEpoch = 0
let isLatestEpochCurrent = () => true
const tokenEpoch = createEpochCommitGuard()

async function fetchToken(epoch: number, isCurrent: () => boolean) {
  if (!isCurrent() || !tokenEpoch.begin(epoch)) throw new Error('Stale socket token request')
  const pending = pendingPrivateSessionForEpoch(epoch)
  if (pending) {
    const session = await pending.catch(() => null)
    if (session) {
      if (!isCurrent() || !tokenEpoch.canCommit(epoch)) throw new Error('Stale socket token response')
      seedSocketToken(session.socket_token, epoch)
      return
    }
  }
  const { data } = await api.get<TokenResponse>('/client/socket_token')
  if (!isCurrent() || !tokenEpoch.canCommit(epoch)) {
    throw new Error('Stale socket token response')
  }
  token = data.data.token
  socketTokenEpoch = epoch
}

export function seedSocketToken(value: string, epoch: number) {
  if (epoch < latestEpoch || !tokenEpoch.begin(epoch)) return
  token = value
  socketTokenEpoch = epoch
}

function socketUrl() {
  return `${getApiBaseUrl().replace(/^http/, 'ws').replace(/\/$/, '')}/socket`
}

export function getSocket(epoch: number, isCurrent: () => boolean): Promise<Socket> {
  if (!isCurrent() || epoch < latestEpoch) {
    return Promise.reject(new Error('Stale socket connection request'))
  }
  latestEpoch = epoch
  isLatestEpochCurrent = isCurrent
  if (socket) {
    return reconnectSocket(epoch, isCurrent).then(() => {
      if (!isCurrent() || epoch !== latestEpoch || !socket)
        throw new Error('Stale socket connection request')
      return socket
    })
  }

  if (pending?.epoch === epoch) return pending.promise
  pending = null

  const initialToken = socketTokenEpoch === epoch && token ? Promise.resolve() : fetchToken(epoch, isCurrent)
  const promise = initialToken.then(() => {
    if (!isCurrent() || epoch !== latestEpoch || !tokenEpoch.canCommit(epoch)) {
      throw new Error('Stale socket connection request')
    }
    const instance = new Socket(socketUrl(), {
      params: () => ({ token }),
      longPollFallbackMs: LONG_POLL_FALLBACK_MS,
    })
    instance.onError(() => {
      if (socket !== instance || !isLatestEpochCurrent()) return
      fetchToken(latestEpoch, isLatestEpochCurrent).catch(() => undefined)
    })
    instance.connect()
    socket = instance
    return instance
  })

  pending = { epoch, promise }
  promise
    .finally(() => {
      if (pending?.promise === promise) pending = null
    })
    .catch(() => undefined)
  return promise
}

export async function reconnectSocket(epoch: number, isCurrent: () => boolean) {
  if (!socket || !isCurrent() || epoch < latestEpoch) return
  latestEpoch = epoch
  isLatestEpochCurrent = isCurrent
  if (socketTokenEpoch === epoch && isCurrent()) return
  await fetchToken(epoch, isCurrent)
  if (!isCurrent() || !tokenEpoch.canCommit(epoch)) return
  const instance = socket
  instance.disconnect(() => {
    if (socket === instance && isCurrent() && tokenEpoch.canCommit(epoch)) instance.connect()
  })
}
