import { describe, expect, it } from 'vitest'
import {
  appendOptimisticMessage,
  createOptimisticUserMessage,
  finalizeSentMessages,
  rollbackOptimisticMessage,
  sortMessages
} from './chatMessages'
import type { Message } from '../types/message'

function persistedMessage(
  id: string,
  role: 'user' | 'assistant',
  content: string,
  conversationId = 'conv-1',
  sequence?: number
): Message {
  const now = '2026-06-17T12:00:00.000Z'
  return {
    id,
    collectionId: 'pbc_messages',
    collectionName: 'messages',
    created: now,
    updated: now,
    conversation: conversationId,
    role,
    content,
    sequence
  }
}

describe('chatMessages optimistic helpers', () => {
  it('appends an optimistic user message immediately', () => {
    const optimistic = createOptimisticUserMessage('conv-1', 'Hello', 'temp-1', 100)
    const messages = appendOptimisticMessage([], optimistic)

    expect(messages).toHaveLength(1)
    expect(messages[0]).toMatchObject({
      id: 'temp-1',
      role: 'user',
      content: 'Hello',
      optimistic: true
    })
  })

  it('rolls back the optimistic message on simulated failure', () => {
    const optimistic = createOptimisticUserMessage('conv-1', 'Hello', 'temp-1', 100)
    let messages = appendOptimisticMessage(
      [persistedMessage('msg-0', 'assistant', 'Earlier reply')],
      optimistic
    )

    expect(messages).toHaveLength(2)

    messages = rollbackOptimisticMessage(messages, 'temp-1')

    expect(messages).toHaveLength(1)
    expect(messages[0].id).toBe('msg-0')
    expect(messages.some((message) => message.id === 'temp-1')).toBe(false)
  })

  it('replaces the optimistic message with persisted user and assistant messages', () => {
    const optimistic = createOptimisticUserMessage('conv-1', 'Hello', 'temp-1', 100)
    const messages = appendOptimisticMessage([], optimistic)

    const userMessage = persistedMessage('msg-user', 'user', 'Hello', 'conv-1', 1)
    const assistantMessage = persistedMessage('msg-ai', 'assistant', '**Echo:** Hello', 'conv-1', 2)

    const finalized = finalizeSentMessages(messages, 'temp-1', userMessage, assistantMessage)

    expect(finalized).toHaveLength(2)
    expect(finalized[0].id).toBe('msg-user')
    expect(finalized[1].id).toBe('msg-ai')
    expect(finalized.some((message) => message.optimistic)).toBe(false)
  })

  it('models the full optimistic send flow: show, then rollback on error', () => {
    const messages = appendOptimisticMessage(
      [],
      createOptimisticUserMessage('conv-1', 'Will fail', 'temp-fail', 200)
    )

    expect(messages[0].optimistic).toBe(true)

    const rolledBack = rollbackOptimisticMessage(messages, 'temp-fail')

    expect(rolledBack).toEqual([])
  })

  it('sorts messages by sequence when reloading from PocketBase', () => {
    const sorted = sortMessages([
      persistedMessage('msg-ai', 'assistant', 'third', 'conv-1', 3),
      persistedMessage('msg-user', 'user', 'first', 'conv-1', 1),
      persistedMessage('msg-ai-2', 'assistant', 'second', 'conv-1', 2)
    ])

    expect(sorted.map((message) => message.id)).toEqual(['msg-user', 'msg-ai-2', 'msg-ai'])
  })
})
