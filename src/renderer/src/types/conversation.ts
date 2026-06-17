import type { RecordModel } from 'pocketbase'

export interface Conversation extends RecordModel {
  title: string
  user: string
}
