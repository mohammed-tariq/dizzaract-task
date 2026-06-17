import { create } from 'zustand'
import { ClientResponseError } from 'pocketbase'
import {
  appendOptimisticMessage,
  createOptimisticUserMessage,
  finalizeSentMessages,
  rollbackOptimisticMessage
} from '../lib/chatMessages'
import { formatChatError } from '../lib/chatErrors'
import { requestMockReply } from '../lib/mockAi'
import { pb } from '../lib/pocketbase'
import type { ChatMessage, Message } from '../types/message'

export type ChatStatus = 'idle' | 'loading' | 'ready' | 'sending' | 'error'

function isCancelledRequest(error: unknown): boolean {
  return error instanceof ClientResponseError && error.isAbort
}

interface ChatState {
  messages: ChatMessage[]
  status: ChatStatus
  error: string | null
  loadedConversationId: string | null
  loadMessages: (conversationId: string) => Promise<void>
  sendMessage: (conversationId: string, content: string) => Promise<void>
  clearError: () => void
  reset: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  status: 'idle',
  error: null,
  loadedConversationId: null,

  loadMessages: async (conversationId) => {
    set({ status: 'loading', error: null, loadedConversationId: conversationId })

    try {
      const messages = await pb.collection('messages').getFullList<Message>({
        filter: `conversation = "${conversationId}"`,
        requestKey: null
      })

      messages.sort((a, b) => {
        const aTime = a.created ? new Date(a.created).getTime() : 0
        const bTime = b.created ? new Date(b.created).getTime() : 0
        return aTime - bTime
      })

      set({
        messages,
        status: 'ready',
        loadedConversationId: conversationId
      })
    } catch (error) {
      if (isCancelledRequest(error)) {
        return
      }
      set({
        status: 'error',
        error: formatChatError(error),
        loadedConversationId: conversationId
      })
    }
  },

  sendMessage: async (conversationId, content) => {
    const trimmed = content.trim()
    if (!trimmed) {
      return
    }

    const tempId = `optimistic-${crypto.randomUUID()}`
    const optimisticMessage = createOptimisticUserMessage(conversationId, trimmed, tempId)

    set((state) => ({
      messages: appendOptimisticMessage(state.messages, optimisticMessage),
      status: 'sending',
      error: null
    }))

    let userMessage: Message | null = null

    try {
      userMessage = await pb.collection('messages').create<Message>({
        conversation: conversationId,
        role: 'user',
        content: trimmed
      })

      const reply = await requestMockReply(trimmed)

      const assistantMessage = await pb.collection('messages').create<Message>({
        conversation: conversationId,
        role: 'assistant',
        content: reply
      })

      set((state) => ({
        messages: finalizeSentMessages(
          state.messages,
          tempId,
          userMessage as Message,
          assistantMessage
        ),
        status: 'ready'
      }))
    } catch (error) {
      if (userMessage) {
        try {
          await pb.collection('messages').delete(userMessage.id)
        } catch (deleteError) {
          console.error('[chatStore] Failed to roll back persisted user message:', deleteError)
        }
      }

      set((state) => ({
        messages: rollbackOptimisticMessage(state.messages, tempId),
        status: 'ready',
        error: formatChatError(error)
      }))
    }
  },

  clearError: () => {
    set({ error: null })
  },

  reset: () => {
    set({
      messages: [],
      status: 'idle',
      error: null,
      loadedConversationId: null
    })
  }
}))
