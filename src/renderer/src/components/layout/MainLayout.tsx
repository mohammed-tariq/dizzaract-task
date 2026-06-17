import { Box, Button, Typography } from '@mui/material'
import { useAuthStore } from '../../stores/authStore'
import { useConversationsStore } from '../../stores/conversationsStore'
import ConversationSidebar from '../sidebar/ConversationSidebar'
import ChatPanel from '../chat/ChatPanel'

export default function MainLayout(): React.JSX.Element {
  const { user, logout } = useAuthStore()
  const { activeId, conversations } = useConversationsStore()

  const activeConversation = conversations.find((item) => item.id === activeId) ?? null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
      <Box
        component="header"
        sx={{
          px: 2,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          AI Chat Desktop
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
          <Button size="small" onClick={() => void logout()}>
            Log out
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <ConversationSidebar />

        {activeConversation ? (
          <ChatPanel
            conversationId={activeConversation.id}
            title={activeConversation.title || 'Untitled'}
          />
        ) : (
          <Box
            component="main"
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
              bgcolor: 'background.default'
            }}
          >
            <Box sx={{ textAlign: 'center', maxWidth: 420 }}>
              <Typography variant="h6" gutterBottom>
                Select a conversation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose one from the sidebar or create a new conversation to get started.
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}
