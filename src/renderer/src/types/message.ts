import type { RecordModel } from 'pocketbase'

export type MessageRole = 'user' | 'assistant'

export interface Message extends RecordModel {
  conversation: string
  role: MessageRole
  content: string
}

export interface ChatMessage extends Message {
  /** True while the message is shown optimistically before PocketBase confirms it. */
  optimistic?: boolean
}
