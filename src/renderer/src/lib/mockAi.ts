import { MOCK_AI_URL } from '../config'

interface MockAiResponse {
  reply: string
}

export async function requestMockReply(message: string): Promise<string> {
  const response = await fetch(`${MOCK_AI_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  })

  if (!response.ok) {
    throw new Error(`Mock AI request failed (${response.status})`)
  }

  const data = (await response.json()) as MockAiResponse
  if (typeof data.reply !== 'string') {
    throw new Error('Mock AI returned an invalid response')
  }

  return data.reply
}
