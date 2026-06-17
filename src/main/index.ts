import { app, shell, BrowserWindow, session } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { registerAuthIpcHandlers } from './ipc/auth'

// Evaluated lazily — @electron-toolkit/utils reads electron.app at import time, which can crash dev.
function isDev(): boolean {
  return !app.isPackaged
}

function applyContentSecurityPolicy(): void {
  // Single source of truth for CSP (no meta tag in index.html — avoids conflicting policies).
  const prodBase =
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
  const devBase =
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
  const PB = 'http://127.0.0.1:8090'
  const MOCK = 'http://127.0.0.1:8787'
  const csp = isDev()
    ? `${devBase} connect-src 'self' http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:* ${PB} ${MOCK}`
    : `${prodBase} connect-src 'self' ${PB} ${MOCK}`

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    })
  })
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      // Security defaults required by the assignment — do not relax these.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: join(__dirname, '../preload/index.js')
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // External links open in the system browser, not a new Electron window.
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev() && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.aichat.desktop')
  }

  applyContentSecurityPolicy()
  registerAuthIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
