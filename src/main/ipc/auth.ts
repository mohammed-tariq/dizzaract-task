import { ipcMain } from 'electron'
import * as tokenStore from '../token-store'
import { openOAuthWindow } from '../oauth-window'

function ipcError(message: string): Error {
  return new Error(message)
}

/**
 * Auth-related IPC handlers. Renderer reaches privileged storage only through these.
 * Each handler catches errors so a failed request never crashes the app.
 */
export function registerAuthIpcHandlers(): void {
  ipcMain.handle('auth:saveToken', async (_event, token: unknown) => {
    try {
      if (typeof token !== 'string' || token.length === 0) {
        throw ipcError('Invalid token')
      }
      await tokenStore.saveToken(token)
    } catch (error) {
      console.error('[auth:saveToken]', error)
      throw error instanceof Error ? error : ipcError('Failed to save token')
    }
  })

  ipcMain.handle('auth:getToken', async () => {
    try {
      return await tokenStore.getToken()
    } catch (error) {
      console.error('[auth:getToken]', error)
      throw error instanceof Error ? error : ipcError('Failed to read token')
    }
  })

  ipcMain.handle('auth:clearToken', async () => {
    try {
      await tokenStore.clearToken()
    } catch (error) {
      console.error('[auth:clearToken]', error)
      throw error instanceof Error ? error : ipcError('Failed to clear token')
    }
  })

  ipcMain.handle('auth:startOAuth', async (_event, authUrl: unknown, redirectUrl: unknown) => {
    try {
      if (typeof authUrl !== 'string' || authUrl.length === 0) {
        throw ipcError('Invalid OAuth URL')
      }
      if (typeof redirectUrl !== 'string' || redirectUrl.length === 0) {
        throw ipcError('Invalid OAuth redirect URL')
      }

      return await openOAuthWindow(authUrl, redirectUrl)
    } catch (error) {
      console.error('[auth:startOAuth]', error)
      throw error instanceof Error ? error : ipcError('OAuth failed')
    }
  })
}
