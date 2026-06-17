import { create } from 'zustand'
import type { RecordModel } from 'pocketbase'
import { formatAuthError } from '../lib/authErrors'
import { pb } from '../lib/pocketbase'
import { signInWithGoogle } from '../lib/oauth'

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  status: AuthStatus
  user: RecordModel | null
  error: string | null
  init: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  signup: (email: string, password: string, passwordConfirm: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

let initPromise: Promise<void> | null = null

async function rehydrateSession(): Promise<RecordModel | null> {
  const token = await window.api.getToken()
  if (!token) {
    return null
  }

  pb.authStore.save(token)

  try {
    const authData = await pb.collection('users').authRefresh()
    return authData.record
  } catch {
    pb.authStore.clear()
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'idle',
  user: null,
  error: null,

  init: async () => {
    if (initPromise) {
      return initPromise
    }

    initPromise = (async () => {
      set({ status: 'loading', error: null })

      try {
        const user = await rehydrateSession()
        set({
          status: user ? 'authenticated' : 'unauthenticated',
          user
        })
      } catch (error) {
        set({
          status: 'unauthenticated',
          user: null,
          error: formatAuthError(error)
        })
      }
    })()

    return initPromise
  },

  login: async (email, password) => {
    set({ status: 'loading', error: null })

    try {
      const authData = await pb.collection('users').authWithPassword(email, password)
      set({
        status: 'authenticated',
        user: authData.record,
        error: null
      })
    } catch (error) {
      set({
        status: 'unauthenticated',
        user: null,
        error: formatAuthError(error)
      })
      throw error
    }
  },

  loginWithGoogle: async () => {
    set({ status: 'loading', error: null })

    try {
      const authData = await signInWithGoogle()
      set({
        status: 'authenticated',
        user: authData.record,
        error: null
      })
    } catch (error) {
      set({
        status: 'unauthenticated',
        user: null,
        error: formatAuthError(error)
      })
      throw error
    }
  },

  signup: async (email, password, passwordConfirm) => {
    if (password !== passwordConfirm) {
      const message = 'Passwords do not match.'
      set({ error: message })
      throw new Error(message)
    }

    set({ status: 'loading', error: null })

    try {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm
      })

      const authData = await pb.collection('users').authWithPassword(email, password)
      set({
        status: 'authenticated',
        user: authData.record,
        error: null
      })
    } catch (error) {
      set({
        status: 'unauthenticated',
        user: null,
        error: formatAuthError(error)
      })
      throw error
    }
  },

  logout: async () => {
    pb.authStore.clear()
    set({
      status: 'unauthenticated',
      user: null,
      error: null
    })
  },

  clearError: () => {
    set({ error: null })
  }
}))
