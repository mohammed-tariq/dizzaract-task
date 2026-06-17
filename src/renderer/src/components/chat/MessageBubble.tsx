import Markdown from 'react-markdown'
import { Box, Typography } from '@mui/material'
import type { ChatMessage } from '../../types/message'

interface MessageBubbleProps {
  message: ChatMessage
}

export default function MessageBubble({ message }: MessageBubbleProps): React.JSX.Element {
  const isUser = message.role === 'user'

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 1.5
      }}
    >
      <Box
        sx={{
          maxWidth: '78%',
          px: 1.75,
          py: 1.25,
          borderRadius: 2,
          bgcolor: isUser ? 'primary.main' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          border: isUser ? 'none' : 1,
          borderColor: 'divider',
          opacity: message.optimistic ? 0.75 : 1
        }}
      >
        {isUser ? (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>
        ) : (
          <Box
            className="markdown-body"
            sx={{
              '& p': { m: 0, mb: 1 },
              '& p:last-child': { mb: 0 },
              '& ul': { m: 0, pl: 2.5 },
              '& strong': { fontWeight: 700 },
              fontSize: '0.875rem',
              lineHeight: 1.5
            }}
          >
            <Markdown>{message.content}</Markdown>
          </Box>
        )}
      </Box>
    </Box>
  )
}
