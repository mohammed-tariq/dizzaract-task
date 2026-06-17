import { create } from 'zustand'
import { ClientResponseError } from 'pocketbase'
import { pb } from '../lib/pocketbase'
import { formatConversationError } from '../lib/conversationErrors'
import type { Conversation } from '../types/conversation'

export type ConversationsStatus = 'idle' | 'loading' | 'ready' | 'error'

/** PocketBase auto-cancels duplicate in-flight requests; ignore those errors in the UI. */
function isCancelledRequest(error: unknown): boolean {
  return error instanceof ClientResponseError && error.isAbort
}

interface ConversationsState {
  conversations: Conversation[]
  activeId: string | null
  status: ConversationsStatus
  error: string | null
  load: () => Promise<void>
  create: (title?: string) => Promise<Conversation | undefined>
  rename: (id: string, title: string) => Promise<void>
  remove: (id: string) => Promise<void>
  select: (id: string) => void
  bumpToTop: (id: string) => Promise<void>
  clearError: () => void
  reset: () => void
}

function requireUserId(): string {
  const userId = pb.authStore.record?.id
  if (!userId) {
    throw new Error('Not authenticated')
  }
  return userId
}

function conversationSortKey(conversation: Conversation): number {
  if (conversation.updated) {
    return new Date(conversation.updated).getTime()
  }
  if (conversation.created) {
    return new Date(conversation.created).getTime()
  }
  return 0
}

function sortConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => conversationSortKey(b) - conversationSortKey(a))
}

export const useConversationsStore = create<ConversationsState>((set, get) => ({
  conversations: [],
  activeId: null,
  status: 'idle',
  error: null,

  load: async () => {
    set({ status: 'loading', error: null })

    try {
      const conversations = await pb.collection('conversations').getFullList<Conversation>({
        requestKey: null
      })

      // PocketBase 0.39 rejects API sort on system date fields for custom collections — sort client-side.
      const sorted = sortConversations(conversations)

      const currentActiveId = get().activeId
      const activeStillExists =
        currentActiveId !== null && sorted.some((item) => item.id === currentActiveId)

      set({
        conversations: sorted,
        status: 'ready',
        activeId: activeStillExists ? currentActiveId : (sorted[0]?.id ?? null)
      })
    } catch (error) {
      if (isCancelledRequest(error)) {
        return
      }
      set({
        status: 'error',
        error: formatConversationError(error)
      })
    }
  },

  create: async (title = 'New conversation') => {
    set({ error: null })

    try {
      const conversation = await pb.collection('conversations').create<Conversation>({
        title,
        user: requireUserId()
      })

      set((state) => ({
        conversations: sortConversations([conversation, ...state.conversations]),
        activeId: conversation.id,
        status: 'ready'
      }))

      return conversation
    } catch (error) {
      set({ error: formatConversationError(error) })
      throw error
    }
  },

  rename: async (id, title) => {
    const trimmed = title.trim()
    if (!trimmed) {
      const message = 'Title cannot be empty.'
      set({ error: message })
      throw new Error(message)
    }

    set({ error: null })

    try {
      const updated = await pb.collection('conversations').update<Conversation>(id, {
        title: trimmed
      })

      set((state) => ({
        conversations: state.conversations.map((item) => (item.id === id ? updated : item))
      }))
    } catch (error) {
      set({ error: formatConversationError(error) })
      throw error
    }
  },

  remove: async (id) => {
    set({ error: null })

    try {
      await pb.collection('conversations').delete(id)

      set((state) => {
        const conversations = state.conversations.filter((item) => item.id !== id)
        const activeId = state.activeId === id ? (conversations[0]?.id ?? null) : state.activeId

        return { conversations, activeId, status: 'ready' }
      })
    } catch (error) {
      set({ error: formatConversationError(error) })
      throw error
    }
  },

  select: (id) => {
    set({ activeId: id })
  },

  bumpToTop: async (id) => {
    const conversation = get().conversations.find((item) => item.id === id)
    if (!conversation) {
      return
    }

    try {
      const updated = await pb.collection('conversations').update<Conversation>(id, {
        title: conversation.title
      })

      set((state) => ({
        conversations: sortConversations([
          updated,
          ...state.conversations.filter((item) => item.id !== id)
        ])
      }))
    } catch (error) {
      console.error('[conversationsStore] bumpToTop', error)
    }
  },

  clearError: () => {
    set({ error: null })
  },

  reset: () => {
    set({
      conversations: [],
      activeId: null,
      status: 'idle',
      error: null
    })
  }
}))
