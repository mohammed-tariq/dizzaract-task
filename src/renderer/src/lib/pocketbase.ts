import PocketBase, { AsyncAuthStore, ClientResponseError } from 'pocketbase'
import { POCKETBASE_URL } from '../config'

function parseTokenFromSerialized(serialized: string): string | null {
  if (!serialized) {
    return null
  }

  try {
    const payload = JSON.parse(serialized) as { token?: string }
    return payload.token ?? null
  } catch {
    return null
  }
}

/**
 * PocketBase AsyncAuthStore routes persistence through the preload IPC bridge.
 * Only the token is written to disk (encrypted in main via safeStorage).
 * The user record stays in memory and is refreshed on startup via authRefresh().
 *
 * AsyncAuthStore does NOT use localStorage (unlike the default LocalAuthStore).
 * Defensive cleanup below removes any legacy pocketbase_auth key if present.
 */
if (typeof window !== 'undefined' && window.localStorage) {
  window.localStorage.removeItem('pocketbase_auth')
  window.localStorage.removeItem('pb_auth')
}

const authStore = new AsyncAuthStore({
  save: async (serialized) => {
    const token = parseTokenFromSerialized(serialized)
    if (token) {
      await window.api.saveToken(token)
      return
    }
    await window.api.clearToken()
  },
  clear: async () => {
    await window.api.clearToken()
  }
})

export const pb = new PocketBase(POCKETBASE_URL, authStore)

export { ClientResponseError }
