export function createAuthRefreshCoordinator(refresh) {
  let flight = null

  function isCurrent(store, epoch, token) {
    return store.sessionEpoch === epoch && store.refreshToken === token
  }

  function isEpochCurrent(store, epoch) {
    return store.sessionEpoch === epoch
  }

  function refreshSession(store, epoch, token) {
    if (!isCurrent(store, epoch, token)) return Promise.resolve(false)

    if (flight?.epoch === epoch && flight.token === token) return flight.promise

    const promise = refresh(token)
      .then((session) => {
        if (!isCurrent(store, epoch, token)) return false
        store.setSession(session)
        return isEpochCurrent(store, epoch)
      })
      .catch(() => {
        if (isCurrent(store, epoch, token)) store.logout()
        return false
      })
      .finally(() => {
        if (flight?.promise === promise) flight = null
      })

    flight = { epoch, token, promise }
    return promise
  }

  return { isCurrent, isEpochCurrent, refreshSession }
}

export function createEpochCommitGuard() {
  let latestEpoch = -1

  function begin(epoch) {
    if (epoch > latestEpoch) latestEpoch = epoch
    return epoch === latestEpoch
  }

  function canCommit(epoch) {
    return epoch === latestEpoch
  }

  return { begin, canCommit }
}
