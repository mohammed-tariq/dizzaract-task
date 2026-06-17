import { ClientResponseError } from 'pocketbase'

export function formatChatError(error: unknown): string {
  if (error instanceof ClientResponseError) {
    if (error.isAbort) {
      return 'Request was cancelled.'
    }
    if (error.status === 0) {
      return 'Cannot reach PocketBase. Is it running on http://127.0.0.1:8090?'
    }
    return error.message || 'Failed to save or load messages.'
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Cannot reach the mock AI server. Is it running on http://127.0.0.1:8787?'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong while sending your message.'
}
