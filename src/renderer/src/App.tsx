import { useEffect } from 'react'
import { Box, CssBaseline, ThemeProvider } from '@mui/material'
import { useAuthStore } from './stores/authStore'
import { useChatStore } from './stores/chatStore'
import { useConversationsStore } from './stores/conversationsStore'
import AuthScreen from './components/auth/AuthScreen'
import MainLayout from './components/layout/MainLayout'
import { appTheme } from './theme'
import './assets/main.css'

function App(): React.JSX.Element {
  const { status, init } = useAuthStore()
  const { load, reset } = useConversationsStore()
  const resetChat = useChatStore((state) => state.reset)

  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => {
    if (status === 'authenticated') {
      void load()
      return
    }

    if (status === 'unauthenticated') {
      reset()
      resetChat()
    }
  }, [status, load, reset, resetChat])

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      {status === 'idle' || status === 'loading' ? (
        <p className="loading-screen">Loading session…</p>
      ) : status === 'unauthenticated' ? (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2
          }}
        >
          <AuthScreen />
        </Box>
      ) : (
        <MainLayout />
      )}
    </ThemeProvider>
  )
}

export default App
