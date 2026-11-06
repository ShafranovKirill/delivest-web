import test from 'node:test'
import assert from 'node:assert/strict'
import axios, { AxiosError } from 'axios'
import { QueryClient } from '@tanstack/vue-query'
import { createEpochCommitGuard } from '../src/modules/auth/api/auth-session.js'
import { installAuthInterceptorCore } from '../src/modules/auth/api/auth-interceptor-core.ts'
import {
  ACTIVE_ORDERS_KEY,
  ADDRESSES_KEY,
  clearPrivateQueries,
  identityQueryKey,
  MY_ORDERS_KEY,
} from '../src/modules/auth/private-query-cache.ts'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function makeStore(clientId = 'A') {
  return {
    sessionEpoch: 0,
    accessToken: `${clientId}-access`,
    refreshToken: clientId,
    clientId,
    logoutCount: 0,
    setSession(session) {
      this.accessToken = session.accessToken
      this.refreshToken = session.refreshToken
      this.clientId = session.clientId
    },
    signIn(clientId) {
      this.sessionEpoch++
      this.accessToken = `${clientId}-access`
      this.refreshToken = `${clientId}-refresh`
      this.clientId = clientId
    },
    logout() {
      this.sessionEpoch++
      this.accessToken = null
      this.refreshToken = null
      this.clientId = null
      this.logoutCount++
    },
  }
}

function createInterceptedApi(store, adapter, refresh) {
  const api = axios.create({ adapter })
  installAuthInterceptorCore(api, {
    getStore: () => store,
    getApiErrorCode: (error) => error?.response?.data?.error ?? null,
    refresh,
  })
  return api
}

function unauthorized(config) {
  return new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
    data: { error: 'unauthorized' },
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
    config,
  })
}

function ok(config, data = { data: 'ok' }) {
  return { data, status: 200, statusText: 'OK', headers: {}, config }
}

test('Axios wiring does not retry after logout while refresh is pending', async () => {
  const pending = deferred()
  const store = makeStore('A')
  let calls = 0
  const api = createInterceptedApi(
    store,
    async (config) => {
      calls++
      throw unauthorized(config)
    },
    () => pending.promise,
  )

  const request = api.get('/resource')
  await new Promise((resolve) => setImmediate(resolve))
  store.logout()
  pending.resolve({ accessToken: 'A-new-access', refreshToken: 'A-new', clientId: 'A' })

  await assert.rejects(request)
  assert.equal(calls, 1)
  assert.equal(store.refreshToken, null)
})

test('Axios wiring keeps B after login while A refresh is pending', async () => {
  const pending = deferred()
  const store = makeStore('A')
  let calls = 0
  const api = createInterceptedApi(
    store,
    async (config) => {
      calls++
      throw unauthorized(config)
    },
    () => pending.promise,
  )

  const request = api.get('/resource')
  await new Promise((resolve) => setImmediate(resolve))
  store.signIn('B')
  pending.resolve({ accessToken: 'A-new-access', refreshToken: 'A-new', clientId: 'A' })

  await assert.rejects(request)
  assert.equal(calls, 1)
  assert.equal(store.clientId, 'B')
})

test('Axios wiring rejects a late 401 from A after B login', async () => {
  const response = deferred()
  const store = makeStore('A')
  let refreshCalls = 0
  const api = createInterceptedApi(
    store,
    (config) =>
      response.promise.then(() => {
        throw unauthorized(config)
      }),
    async () => {
      refreshCalls++
      return { accessToken: 'unexpected', refreshToken: 'unexpected', clientId: 'A' }
    },
  )

  const request = api.get('/resource')
  await new Promise((resolve) => setImmediate(resolve))
  store.signIn('B')
  response.resolve()

  await assert.rejects(request)
  assert.equal(refreshCalls, 0)
  assert.equal(store.clientId, 'B')
})

test('Axios wiring does not log out B when the old A refresh fails', async () => {
  const pending = deferred()
  const store = makeStore('A')
  const api = createInterceptedApi(
    store,
    async (config) => {
      throw unauthorized(config)
    },
    () => pending.promise,
  )

  const request = api.get('/resource')
  await new Promise((resolve) => setImmediate(resolve))
  store.signIn('B')
  pending.reject(new Error('A refresh failed'))

  await assert.rejects(request)
  assert.equal(store.logoutCount, 0)
  assert.equal(store.clientId, 'B')
})

test('Axios wiring retries same-session 401s after one shared refresh', async () => {
  const pending = deferred()
  const store = makeStore('A')
  let refreshCalls = 0
  let requestCalls = 0
  const api = createInterceptedApi(
    store,
    async (config) => {
      requestCalls++
      if (config.headers.Authorization === 'Bearer A-access') throw unauthorized(config)
      return ok(config)
    },
    () => {
      refreshCalls++
      return pending.promise
    },
  )

  const first = api.get('/first')
  const second = api.get('/second')
  await new Promise((resolve) => setImmediate(resolve))
  pending.resolve({ accessToken: 'A-new-access', refreshToken: 'A-rotated', clientId: 'A' })

  const [firstResult, secondResult] = await Promise.all([first, second])
  assert.equal(firstResult.status, 200)
  assert.equal(secondResult.status, 200)
  assert.equal(refreshCalls, 1)
  assert.equal(requestCalls, 4)
})

test('a late A socket token cannot overwrite B socket credentials', async () => {
  const epochGuard = createEpochCommitGuard()
  let socketToken = null
  const requestToken = async (epoch, tokenPromise) => {
    epochGuard.begin(epoch)
    const value = await tokenPromise
    if (epochGuard.canCommit(epoch)) socketToken = value
  }
  const tokenA = deferred()
  const tokenB = deferred()
  const requestA = requestToken(0, tokenA.promise)
  const requestB = requestToken(1, tokenB.promise)

  tokenB.resolve('socket-B')
  await requestB
  tokenA.resolve('socket-A')
  await requestA

  assert.equal(socketToken, 'socket-B')
})

test('private cache is identity scoped and removed without clearing guest active orders', () => {
  const queryClient = new QueryClient()
  queryClient.setQueryData(identityQueryKey(MY_ORDERS_KEY, 'A'), ['A order'])
  queryClient.setQueryData(identityQueryKey(ADDRESSES_KEY, 'A'), ['A address'])
  queryClient.setQueryData(identityQueryKey(ACTIVE_ORDERS_KEY, 'A'), ['A active order'])
  queryClient.setQueryData(identityQueryKey(MY_ORDERS_KEY, 'B'), ['B order'])
  queryClient.setQueryData(identityQueryKey(ACTIVE_ORDERS_KEY, null), ['guest order'])

  clearPrivateQueries(queryClient, 'A')

  assert.equal(queryClient.getQueryData(identityQueryKey(MY_ORDERS_KEY, 'A')), undefined)
  assert.equal(queryClient.getQueryData(identityQueryKey(ADDRESSES_KEY, 'A')), undefined)
  assert.equal(queryClient.getQueryData(identityQueryKey(ACTIVE_ORDERS_KEY, 'A')), undefined)
  assert.deepEqual(queryClient.getQueryData(identityQueryKey(MY_ORDERS_KEY, 'B')), ['B order'])
  assert.deepEqual(queryClient.getQueryData(identityQueryKey(ACTIVE_ORDERS_KEY, null)), [
    'guest order',
  ])
  queryClient.setQueryData(identityQueryKey(MY_ORDERS_KEY, 'A'), ['late A response'])
  assert.deepEqual(queryClient.getQueryData(identityQueryKey(MY_ORDERS_KEY, 'A')), [
    'late A response',
  ])
  assert.deepEqual(queryClient.getQueryData(identityQueryKey(MY_ORDERS_KEY, 'B')), ['B order'])
  queryClient.clear()
})
