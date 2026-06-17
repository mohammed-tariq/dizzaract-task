import { ClientResponseError } from 'pocketbase'

export function formatAuthError(error: unknown): string {
  if (error instanceof ClientResponseError) {
    if (error.status === 0) {
      return 'Cannot reach the server. Is PocketBase running on http://127.0.0.1:8090?'
    }

    if (error.status === 400 && error.response?.data) {
      const data = error.response.data as Record<string, { message?: string }>
      const firstField = Object.values(data).find((field) => field?.message)
      if (firstField?.message) {
        return firstField.message
      }
    }

    if (error.status === 400 || error.status === 401 || error.status === 403) {
      return 'Invalid email or password.'
    }

    return error.message || 'Something went wrong. Please try again.'
  }

  if (error instanceof Error) {
    if (error.message.includes('Sign-in cancelled')) {
      return 'Sign-in cancelled.'
    }
    if (error.message.includes('auth:startOAuth')) {
      const match = error.message.match(/Error: (.+)$/)
      if (match?.[1]) {
        return match[1]
      }
    }
    return error.message
  }

  return 'Something went wrong. Please try again.'
}
