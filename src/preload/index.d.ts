export interface OAuthRedirectResult {
  code: string
  state: string
}

export interface PreloadApi {
  saveToken: (token: string) => Promise<void>
  getToken: () => Promise<string | null>
  clearToken: () => Promise<void>
  /** Opens a sandboxed OAuth window in main; returns auth code + state from the redirect. */
  startOAuth: (authUrl: string, redirectUrl: string) => Promise<OAuthRedirectResult>
}

declare global {
  interface Window {
    api: PreloadApi
  }
}

export {}
