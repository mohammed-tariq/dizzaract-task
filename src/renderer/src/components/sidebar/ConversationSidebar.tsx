import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useConversationsStore } from '../../stores/conversationsStore'
import type { Conversation } from '../../types/conversation'

const DRAWER_WIDTH = 280

interface RenameState {
  open: boolean
  conversation: Conversation | null
  title: string
}

interface DeleteState {
  open: boolean
  conversation: Conversation | null
}

export default function ConversationSidebar(): React.JSX.Element {
  const {
    conversations,
    activeId,
    status,
    error,
    load,
    create,
    rename,
    remove,
    select,
    clearError
  } = useConversationsStore()

  const [renameState, setRenameState] = useState<RenameState>({
    open: false,
    conversation: null,
    title: ''
  })
  const [deleteState, setDeleteState] = useState<DeleteState>({
    open: false,
    conversation: null
  })
  const [isCreating, setIsCreating] = useState(false)

  const openRename = (conversation: Conversation): void => {
    setRenameState({ open: true, conversation, title: conversation.title })
  }

  const closeRename = (): void => {
    setRenameState({ open: false, conversation: null, title: '' })
  }

  const openDelete = (conversation: Conversation): void => {
    setDeleteState({ open: true, conversation })
  }

  const closeDelete = (): void => {
    setDeleteState({ open: false, conversation: null })
  }

  const handleCreate = async (): Promise<void> => {
    setIsCreating(true)
    try {
      await create()
    } catch {
      // Error is stored in the conversations store.
    } finally {
      setIsCreating(false)
    }
  }

  const handleRenameSubmit = async (): Promise<void> => {
    if (!renameState.conversation) {
      return
    }

    try {
      await rename(renameState.conversation.id, renameState.title)
      closeRename()
    } catch {
      // Error is stored in the conversations store.
    }
  }

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteState.conversation) {
      return
    }

    try {
      await remove(deleteState.conversation.id)
      closeDelete()
    } catch {
      // Error is stored in the conversations store.
    }
  }

  return (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Conversations
        </Typography>
        <Tooltip title="New conversation">
          <span>
            <IconButton
              size="small"
              color="primary"
              disabled={isCreating || status === 'loading'}
              onClick={() => void handleCreate()}
            >
              {isCreating ? <CircularProgress size={18} /> : <AddIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {error && (
        <Alert
          severity="error"
          onClose={clearError}
          action={
            status === 'error' ? (
              <Button color="inherit" size="small" onClick={() => void load()}>
                Retry
              </Button>
            ) : undefined
          }
          sx={{ m: 1.5, mb: 0 }}
        >
          {error}
        </Alert>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {status === 'loading' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {status !== 'loading' && conversations.length === 0 && (
          <Box sx={{ px: 2, py: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              No conversations yet.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              disabled={isCreating}
              onClick={() => void handleCreate()}
            >
              Start one
            </Button>
          </Box>
        )}

        {status !== 'loading' && conversations.length > 0 && (
          <List dense disablePadding>
            {conversations.map((conversation) => {
              const selected = conversation.id === activeId

              return (
                <ListItemButton
                  key={conversation.id}
                  selected={selected}
                  onClick={() => select(conversation.id)}
                  sx={{ py: 1.25, alignItems: 'flex-start' }}
                >
                  <ListItemText
                    primary={conversation.title || 'Untitled'}
                    secondary={
                      conversation.updated
                        ? new Date(conversation.updated).toLocaleString()
                        : undefined
                    }
                    slotProps={{
                      primary: { noWrap: true },
                      secondary: { variant: 'caption' }
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 0.25, ml: 0.5 }}>
                    <Tooltip title="Rename">
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={(event) => {
                          event.stopPropagation()
                          openRename(conversation)
                        }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={(event) => {
                          event.stopPropagation()
                          openDelete(conversation)
                        }}
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemButton>
              )
            })}
          </List>
        )}
      </Box>

      <Dialog open={renameState.open} onClose={closeRename} fullWidth maxWidth="xs">
        <DialogTitle>Rename conversation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={renameState.title}
            onChange={(event) =>
              setRenameState((state) => ({ ...state, title: event.target.value }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRename}>Cancel</Button>
          <Button variant="contained" onClick={() => void handleRenameSubmit()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteState.open} onClose={closeDelete}>
        <DialogTitle>Delete conversation?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete &ldquo;{deleteState.conversation?.title}&rdquo; and its
            messages.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDelete}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => void handleDeleteConfirm()}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
