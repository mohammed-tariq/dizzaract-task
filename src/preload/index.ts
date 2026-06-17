import { contextBridge, ipcRenderer } from 'electron'

/**
 * Small, explicitly-typed preload bridge. The renderer must not access ipcRenderer
 * or Node APIs directly — only these methods are exposed via contextBridge.
 */
const api = {
  saveToken: (token: string): Promise<void> => ipcRenderer.invoke('auth:saveToken', token),
  getToken: (): Promise<string | null> => ipcRenderer.invoke('auth:getToken'),
  clearToken: (): Promise<void> => ipcRenderer.invoke('auth:clearToken'),
  startOAuth: (authUrl: string, redirectUrl: string): Promise<{ code: string; state: string }> =>
    ipcRenderer.invoke('auth:startOAuth', authUrl, redirectUrl)
}

if (!process.contextIsolated) {
  throw new Error('contextIsolation must be enabled')
}

try {
  contextBridge.exposeInMainWorld('api', api)
} catch (error) {
  console.error('Failed to expose preload API:', error)
}
