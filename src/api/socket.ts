import { Socket } from 'phoenix'
import { api } from '@/api/client'
import { getApiBaseUrl } from '@/utils/env'
import { createEpochCommitGuard } from '@/modules/auth/api/auth-session.js'

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
  const { data } = await api.get<TokenResponse>('/client/socket_token')
  if (!isCurrent() || !tokenEpoch.canCommit(epoch)) {
    throw new Error('Stale socket token response')
  }
  token = data.data.token
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
  if (socket) return Promise.resolve(socket)

  if (pending) {
    if (pending.epoch === epoch) return pending.promise
    return pending.promise.catch(() => undefined).then(() => getSocket(epoch, isCurrent))
  }

  const promise = fetchToken(epoch, isCurrent).then(() => {
    const instance = new Socket(socketUrl(), {
      params: () => ({ token }),
      longPollFallbackMs: LONG_POLL_FALLBACK_MS,
    })
    instance.onError(() => {
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
  socket.disconnect(() => {
    if (isCurrent() && tokenEpoch.canCommit(epoch)) socket?.connect()
  })
}
