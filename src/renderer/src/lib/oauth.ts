import type { RecordAuthResponse } from 'pocketbase'
import { OAUTH_REDIRECT_URL } from '../config'
import { pb } from './pocketbase'

/**
 * Google OAuth via PocketBase manual code exchange.
 * Main process opens the provider window and intercepts the redirect;
 * token exchange happens here so AsyncAuthStore persists via safeStorage (not localStorage).
 */
export async function signInWithGoogle(): Promise<RecordAuthResponse> {
  const authMethods = await pb.collection('users').listAuthMethods()

  if (!authMethods.oauth2?.enabled) {
    throw new Error('OAuth2 is not enabled for the users collection.')
  }

  const provider = authMethods.oauth2.providers.find((item) => item.name === 'google')
  if (!provider) {
    throw new Error(
      'Google OAuth is not configured in PocketBase. See README → Google OAuth setup.'
    )
  }

  const authUrl = `${provider.authURL}${encodeURIComponent(OAUTH_REDIRECT_URL)}`
  const { code, state } = await window.api.startOAuth(authUrl, OAUTH_REDIRECT_URL)

  if (state !== provider.state) {
    throw new Error('OAuth state mismatch. Please try again.')
  }

  return pb
    .collection('users')
    .authWithOAuth2Code(provider.name, code, provider.codeVerifier, OAUTH_REDIRECT_URL)
}
