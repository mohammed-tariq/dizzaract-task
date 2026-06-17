import { ClientResponseError } from 'pocketbase'

export function formatConversationError(error: unknown): string {
  if (error instanceof ClientResponseError) {
    if (error.isAbort) {
      return 'Request was cancelled.'
    }
    if (error.status === 0) {
      return 'Cannot reach PocketBase. Is it running on http://127.0.0.1:8090?'
    }
    return error.message || 'Something went wrong with conversations.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong with conversations.'
}
