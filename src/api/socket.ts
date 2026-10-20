import { Socket } from 'phoenix'
import { api } from '@/api/client'
import { getApiBaseUrl } from '@/utils/env'

type TokenResponse = { data: { token: string } }

let socket: Socket | null = null
let token: string | null = null
let pending: Promise<Socket> | null = null

async function fetchToken() {
  const { data } = await api.get<TokenResponse>('/client/socket_token')
  token = data.data.token
}

function socketUrl() {
  return `${getApiBaseUrl().replace(/^http/, 'ws').replace(/\/$/, '')}/socket`
}

export function getSocket(): Promise<Socket> {
  if (socket) return Promise.resolve(socket)

  pending ??= fetchToken().then(() => {
    const instance = new Socket(socketUrl(), { params: () => ({ token }) })
    instance.onError(() => {
      fetchToken().catch(() => undefined)
    })
    instance.connect()
    socket = instance
    return instance
  })

  pending.catch(() => (pending = null))
  return pending
}

export async function reconnectSocket() {
  if (!socket) return
  await fetchToken()
  socket.disconnect(() => socket?.connect())
}
