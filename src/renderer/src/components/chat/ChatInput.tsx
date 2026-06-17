import { useEffect, useRef, useState } from 'react'
import { Box, IconButton, TextField } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'

interface ChatInputProps {
  disabled?: boolean
  onSend: (content: string) => Promise<void>
}

export default function ChatInput({ disabled = false, onSend }: ChatInputProps): React.JSX.Element {
  const [value, setValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const focusInput = (): void => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true })
      })
    })
  }

  useEffect(() => {
    if (!disabled && !isSending) {
      focusInput()
    }
  }, [disabled, isSending])

  const handleSend: () => Promise<void> = async () => {
    const trimmed = value.trim()
    if (!trimmed || disabled || isSending) {
      return
    }

    setIsSending(true)
    try {
      await onSend(trimmed)
      setValue('')
    } finally {
      setIsSending(false)
      focusInput()
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <TextField
        fullWidth
        multiline
        minRows={1}
        maxRows={6}
        inputRef={inputRef}
        placeholder="Message… (Enter to send, Shift+Enter for newline)"
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        size="small"
      />
      <IconButton
        color="primary"
        disabled={disabled || isSending || !value.trim()}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => void handleSend()}
        sx={{ alignSelf: 'flex-end' }}
      >
        <SendIcon />
      </IconButton>
    </Box>
  )
}
