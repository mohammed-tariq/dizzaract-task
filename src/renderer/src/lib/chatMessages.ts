import type { ChatMessage, Message } from '../types/message'

export function messageSortKey(message: ChatMessage): number {
  if (typeof message.sequence === 'number' && !Number.isNaN(message.sequence)) {
    return message.sequence
  }

  if (message.created) {
    return new Date(message.created).getTime()
  }

  return 0
}

export function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => {
    const diff = messageSortKey(a) - messageSortKey(b)
    if (diff !== 0) {
      return diff
    }

    return a.id.localeCompare(b.id)
  })
}

export function createOptimisticUserMessage(
  conversationId: string,
  content: string,
  tempId: string,
  sequence: number
): ChatMessage {
  const now = new Date().toISOString()

  return {
    id: tempId,
    collectionId: '',
    collectionName: 'messages',
    created: now,
    updated: now,
    conversation: conversationId,
    role: 'user',
    content,
    sequence,
    optimistic: true
  }
}

export function appendOptimisticMessage(
  messages: ChatMessage[],
  optimisticMessage: ChatMessage
): ChatMessage[] {
  return [...messages, optimisticMessage]
}

export function rollbackOptimisticMessage(messages: ChatMessage[], tempId: string): ChatMessage[] {
  return messages.filter((message) => message.id !== tempId)
}

export function finalizeSentMessages(
  messages: ChatMessage[],
  tempId: string,
  userMessage: Message,
  assistantMessage: Message
): ChatMessage[] {
  return sortMessages([
    ...messages.filter((message) => message.id !== tempId),
    userMessage,
    assistantMessage
  ])
}
