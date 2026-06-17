import { app, safeStorage } from 'electron'
import { readFile, writeFile, unlink } from 'fs/promises'
import { join } from 'path'

const TOKEN_FILE = 'auth-token.enc'

function tokenPath(): string {
  return join(app.getPath('userData'), TOKEN_FILE)
}

function assertEncryptionAvailable(): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption is not available on this system')
  }
}

/**
 * Encrypt and persist the auth token in the app userData directory.
 * Electron safeStorage uses the OS keychain — never plaintext on disk.
 */
export async function saveToken(token: string): Promise<void> {
  assertEncryptionAvailable()
  const encrypted = safeStorage.encryptString(token)
  await writeFile(tokenPath(), encrypted)
}

export async function getToken(): Promise<string | null> {
  let encrypted: Buffer

  try {
    encrypted = await readFile(tokenPath())
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === 'ENOENT') {
      return null
    }
    throw error
  }

  try {
    assertEncryptionAvailable()
    return safeStorage.decryptString(encrypted)
  } catch (error) {
    // Corrupt or undecryptable blob — remove it so launch cannot crash-loop.
    console.error('[token-store] Failed to decrypt token, clearing file:', error)
    await clearToken()
    return null
  }
}

export async function clearToken(): Promise<void> {
  try {
    await unlink(tokenPath())
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === 'ENOENT') {
      return
    }
    throw error
  }
}
