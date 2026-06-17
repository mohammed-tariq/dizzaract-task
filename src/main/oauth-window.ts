import { BrowserWindow } from 'electron'
import type { CallbackResponse, OnBeforeRequestListenerDetails } from 'electron'

export interface OAuthRedirectResult {
  code: string
  state: string
}

/**
 * Opens a sandboxed BrowserWindow for the OAuth provider flow.
 * Intercepts navigation to redirectUrl, extracts code + state, then closes the window.
 * Electron-specific: a normal browser popup cannot capture the redirect cleanly in desktop apps.
 */
export function openOAuthWindow(
  authUrl: string,
  redirectUrl: string
): Promise<OAuthRedirectResult> {
  return new Promise((resolve, reject) => {
    let settled = false
    const redirectPrefix = redirectUrl.split('?')[0]

    const oauthWindow = new BrowserWindow({
      width: 520,
      height: 720,
      show: true,
      autoHideMenuBar: true,
      webPreferences: {
        partition: 'oauth-temp',
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })

    const { session } = oauthWindow.webContents
    const requestFilter = { urls: [`${redirectPrefix}*`] }

    const cleanup = (): void => {
      session.webRequest.onBeforeRequest(requestFilter, null)
      oauthWindow.webContents.removeListener('will-redirect', onWillRedirect)
      oauthWindow.webContents.removeListener('will-navigate', onWillNavigate)
      oauthWindow.webContents.removeListener('did-navigate', onDidNavigate)
      oauthWindow.webContents.removeListener('did-redirect-navigation', onDidRedirect)
    }

    const finish = (handler: () => void): void => {
      if (settled) {
        return
      }
      settled = true
      cleanup()
      if (!oauthWindow.isDestroyed()) {
        oauthWindow.close()
      }
      handler()
    }

    const tryCaptureRedirect = (targetUrl: string): boolean => {
      if (!targetUrl.startsWith(redirectPrefix)) {
        return false
      }

      const parsed = new URL(targetUrl)
      const error = parsed.searchParams.get('error')

      if (error) {
        finish(() => {
          reject(new Error(parsed.searchParams.get('error_description') || error))
        })
        return true
      }

      const code = parsed.searchParams.get('code')
      const state = parsed.searchParams.get('state')

      if (!code || !state) {
        return false
      }

      finish(() => {
        resolve({ code, state })
      })
      return true
    }

    const onBeforeRequest = (
      details: OnBeforeRequestListenerDetails,
      callback: (response: CallbackResponse) => void
    ): void => {
      if (tryCaptureRedirect(details.url)) {
        callback({ cancel: true })
        return
      }
      callback({})
    }

    const onWillRedirect = (event: Electron.Event, targetUrl: string): void => {
      if (tryCaptureRedirect(targetUrl)) {
        event.preventDefault()
      }
    }

    const onWillNavigate = (event: Electron.Event, targetUrl: string): void => {
      if (tryCaptureRedirect(targetUrl)) {
        event.preventDefault()
      }
    }

    const onDidNavigate = (_event: Electron.Event, targetUrl: string): void => {
      tryCaptureRedirect(targetUrl)
    }

    const onDidRedirect = (
      event: Electron.Event<Electron.WebContentsDidRedirectNavigationEventParams>
    ): void => {
      tryCaptureRedirect(event.url)
    }

    session.webRequest.onBeforeRequest(requestFilter, onBeforeRequest)
    oauthWindow.webContents.on('will-redirect', onWillRedirect)
    oauthWindow.webContents.on('will-navigate', onWillNavigate)
    oauthWindow.webContents.on('did-navigate', onDidNavigate)
    oauthWindow.webContents.on('did-redirect-navigation', onDidRedirect)

    oauthWindow.on('closed', () => {
      finish(() => {
        reject(new Error('Sign-in cancelled'))
      })
    })

    oauthWindow.loadURL(authUrl).catch((error) => {
      finish(() => {
        reject(error instanceof Error ? error : new Error('Failed to open OAuth window'))
      })
    })
  })
}
