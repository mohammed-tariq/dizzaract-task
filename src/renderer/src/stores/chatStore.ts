import { create } from 'zustand'
import { ClientResponseError } from 'pocketbase'
import {
  appendOptimisticMessage,
  createOptimisticUserMessage,
  finalizeSentMessages,
  rollbackOptimisticMessage,
  sortMessages
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
    set({
      status: 'loading',
      error: null,
      loadedConversationId: conversationId,
      messages: []
    })

    try {
      const messages = await pb.collection('messages').getFullList<Message>({
        filter: `conversation = "${conversationId}"`,
        requestKey: null
      })

      const sorted = sortMessages(messages)

      set((state) => {
        if (state.loadedConversationId !== conversationId) {
          return state
        }

        return {
          messages: sorted,
          status: 'ready',
          loadedConversationId: conversationId
        }
      })
    } catch (error) {
      if (isCancelledRequest(error)) {
        return
      }
      set((state) => {
        if (state.loadedConversationId !== conversationId) {
          return state
        }

        return {
          status: 'error',
          error: formatChatError(error),
          loadedConversationId: conversationId
        }
      })
    }
  },

  sendMessage: async (conversationId, content) => {
    const trimmed = content.trim()
    if (!trimmed) {
      return
    }

    const tempId = `optimistic-${crypto.randomUUID()}`
    const userSequence = Date.now()
    const optimisticMessage = createOptimisticUserMessage(
      conversationId,
      trimmed,
      tempId,
      userSequence
    )

    set((state) => {
      const base = {
        status: 'sending' as const,
        error: null
      }

      if (state.loadedConversationId !== conversationId) {
        return base
      }

      return {
        ...base,
        messages: appendOptimisticMessage(state.messages, optimisticMessage)
      }
    })

    let userMessage: Message | null = null

    try {
      userMessage = await pb.collection('messages').create<Message>({
        conversation: conversationId,
        role: 'user',
        content: trimmed,
        sequence: userSequence
      })

      const reply = await requestMockReply(trimmed)

      const assistantMessage = await pb.collection('messages').create<Message>({
        conversation: conversationId,
        role: 'assistant',
        content: reply,
        sequence: userSequence + 1
      })

      set((state) => {
        if (state.loadedConversationId !== conversationId) {
          return { status: 'ready' }
        }

        return {
          messages: finalizeSentMessages(
            state.messages,
            tempId,
            userMessage as Message,
            assistantMessage
          ),
          status: 'ready'
        }
      })
    } catch (error) {
      if (userMessage) {
        try {
          await pb.collection('messages').delete(userMessage.id)
        } catch (deleteError) {
          console.error('[chatStore] Failed to roll back persisted user message:', deleteError)
        }
      }

      set((state) => {
        if (state.loadedConversationId !== conversationId) {
          return { status: 'ready', error: formatChatError(error) }
        }

        return {
          messages: rollbackOptimisticMessage(state.messages, tempId),
          status: 'ready',
          error: formatChatError(error)
        }
      })
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
