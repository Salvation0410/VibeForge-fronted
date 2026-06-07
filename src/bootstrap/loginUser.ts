export interface LoginUserBootstrapStore {
  hasFetched: boolean
  fetchLoginUser: () => Promise<unknown>
}

export async function ensureLoginUserBootstrapped(store: LoginUserBootstrapStore) {
  if (store.hasFetched) {
    return
  }

  await store.fetchLoginUser()
}
