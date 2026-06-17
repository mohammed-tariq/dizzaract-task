import type { ChatMessage, Message } from '../types/message'

export function createOptimisticUserMessage(
  conversationId: string,
  content: string,
  tempId: string
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
  return [...messages.filter((message) => message.id !== tempId), userMessage, assistantMessage]
}
