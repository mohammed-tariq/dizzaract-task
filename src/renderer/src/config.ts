/** Mock AI server URL — must use 127.0.0.1 to match CSP connect-src. */
export const MOCK_AI_URL = 'http://127.0.0.1:8787'

/** PocketBase API base URL — must use 127.0.0.1 to match CSP connect-src. */
export const POCKETBASE_URL = 'http://127.0.0.1:8090'

/** OAuth redirect URL registered in Google Cloud + passed to authWithOAuth2Code. */
export const OAUTH_REDIRECT_URL = `${POCKETBASE_URL}/api/oauth2-redirect`
