type SessionStore<Session> = {
  sessionEpoch: number
  refreshToken: string | null
  setSession: (session: Session) => void
  logout: () => void
}

export function createAuthRefreshCoordinator<Session>(
  refresh: (token: string) => Promise<Session>,
): {
  isCurrent: (store: SessionStore<Session>, epoch: number, token: string) => boolean
  isEpochCurrent: (store: SessionStore<Session>, epoch: number) => boolean
  refreshSession: (store: SessionStore<Session>, epoch: number, token: string) => Promise<boolean>
}

export function createEpochCommitGuard(): {
  begin: (epoch: number) => boolean
  canCommit: (epoch: number) => boolean
}
