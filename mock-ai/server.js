const http = require('http')

const HOST = '127.0.0.1'
const PORT = 8787

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

const MOCK_REPLIES = [
  'Hey! How are you doing today?',
  "I'm doing great, thanks for asking. What's on your mind?",
  "That's an interesting point. Tell me more!",
  "Good question — I'd say it depends on the context.",
  "Ha, fair enough. Anything else you'd like to chat about?",
  "Sure thing! I'm just a mock server, but I'm happy to help.",
  "Not bad at all. Hope your day is going well too.",
  "I hear you. Want to dig into that a bit more?",
  "Sounds good to me. What would you like to try next?",
  "Thanks for sharing that. Here's what I think…",
  "Hey there! Ready when you are.",
  "All good here. How can I help you out?",
  "Nice one! I like where this is going.",
  "Hmm, let me think about that for a second…",
  "Absolutely — let's keep the conversation going."
]

function pickMockReply(userMessage) {
  const trimmed = userMessage.trim()
  const base = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)]
  return `**${base}**\n\n- You said: "${trimmed}"\n- Echo: ${trimmed}`
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  if (req.method !== 'POST' || req.url !== '/chat') {
    res.writeHead(404, { ...CORS_HEADERS, 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  let body = ''
  req.on('data', (chunk) => {
    body += chunk
  })
  req.on('end', () => {
    try {
      const { message } = JSON.parse(body)
      if (typeof message !== 'string' || !message.trim()) {
        res.writeHead(400, { ...CORS_HEADERS, 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'message is required' }))
        return
      }

      const reply = pickMockReply(message)
      res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ reply }))
    } catch {
      res.writeHead(400, { ...CORS_HEADERS, 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid JSON' }))
    }
  })
})

server.listen(PORT, HOST, () => {
  console.log(`Mock AI server listening on http://${HOST}:${PORT}`)
})
