import { useEffect, useRef } from 'react'
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'
import { useChatStore } from '../../stores/chatStore'
import { useConversationsStore } from '../../stores/conversationsStore'
import ChatInput from './ChatInput'
import MessageBubble from './MessageBubble'

interface ChatPanelProps {
  conversationId: string
  title: string
}

export default function ChatPanel({ conversationId, title }: ChatPanelProps): React.JSX.Element {
  const { messages, status, error, loadMessages, sendMessage, clearError } = useChatStore()
  const bumpConversationToTop = useConversationsStore((state) => state.bumpToTop)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const isLoading = status === 'loading'
  const isSending = status === 'sending'
  const conversationMessages = messages.filter((message) => message.conversation === conversationId)
  const showEmpty = status === 'ready' && conversationMessages.length === 0

  useEffect(() => {
    void loadMessages(conversationId)
  }, [conversationId, loadMessages])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) {
      return
    }

    container.scrollTop = container.scrollHeight
  }, [conversationMessages, status])

  const handleSend = async (content: string): Promise<void> => {
    await sendMessage(conversationId, content)
    void bumpConversationToTop(conversationId)
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        bgcolor: 'background.default'
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          onClose={clearError}
          action={
            status === 'error' ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => void loadMessages(conversationId)}
              >
                Retry
              </Button>
            ) : undefined
          }
          sx={{ m: 2, mb: 0 }}
        >
          {error}
        </Alert>
      )}

      <Box ref={scrollContainerRef} sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {showEmpty && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" color="text.secondary">
              No messages yet. Say hello!
            </Typography>
          </Box>
        )}

        {!isLoading &&
          conversationMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

        <div ref={bottomRef} />
      </Box>

      <ChatInput disabled={isLoading || status === 'error'} onSend={handleSend} />

      {isSending && (
        <Typography variant="caption" color="text.secondary" sx={{ px: 2, pb: 1 }}>
          Waiting for reply…
        </Typography>
      )}
    </Box>
  )
}
