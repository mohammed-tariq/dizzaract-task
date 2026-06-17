# Notes

## Structure

```
src/
  main/           Electron main process (BrowserWindow, CSP, safeStorage, IPC)
  preload/        Typed contextBridge → window.api
  renderer/       React 19 UI
    stores/       Three Zustand stores: auth, conversations, chat
    lib/          PocketBase client, mock AI client, pure helpers
    components/   auth/, sidebar/, chat/, layout/
pocketbase/       Binary + pb_migrations/ (schema as code)
mock-ai/          small Node HTTP echo server
```

State is split across three focused Zustand stores — never one giant store:

- **authStore** — session, login/signup/logout, rehydration
- **conversationsStore** — sidebar CRUD, active conversation
- **chatStore** — messages for active conversation, optimistic send

## Security choices

**CSP** is applied via session response headers in main so it can differ between dev and prod; the static meta CSP was removed to avoid a conflicting, over-restrictive second policy.

**Auth token storage:** PocketBase SDK runs in the renderer (`AsyncAuthStore`), but persistence is overridden: only the JWT token is sent over the typed IPC bridge (`window.api.saveToken` / `getToken` / `clearToken`) and encrypted in the main process with Electron `safeStorage`. The user record is kept in memory and re-fetched on startup via `authRefresh()` — never stored in `localStorage` or plaintext on disk.

`safeStorage` requires an OS keychain/keyring; without one it surfaces a clear "encryption unavailable" error rather than downgrading to plaintext — failing loud is the correct security trade-off.

**safeStorage vs PocketBase SDK ambiguity:** The assignment requires both "PocketBase SDK in renderer" and "token in safeStorage via IPC." I chose to run the SDK in the renderer (simplest for collection CRUD and auth) while overriding `AsyncAuthStore` so only the token crosses the IPC boundary into main-process encryption. An alternative would be proxying all PocketBase calls through main, but that adds IPC surface area without much gain for this scope.

## What I'd do next

1. **Tailwind** — migrate MUI layout shells to Tailwind utilities if design polish matters; keep MUI for complex widgets.
2. **Conversation auto-title** — derive title from first user message instead of "New conversation".
3. **E2E smoke test** — Playwright against packaged app for login → chat → relaunch.
4. **Packaged PocketBase** — spawn PocketBase from main on first launch for a true one-click experience (out of scope for a frontend take-home).

## Google OAuth (implemented)

Manual code exchange (not the popup+realtime shortcut): renderer calls `listAuthMethods()`, main opens a sandboxed `BrowserWindow` via `window.api.startOAuth(authUrl, redirectUrl)`, intercepts navigation to `http://127.0.0.1:8090/api/oauth2-redirect`, then renderer calls `authWithOAuth2Code()`. Token lands in `AsyncAuthStore` → IPC → `safeStorage` — same as email/password. Google Client ID/secret live in PocketBase admin only.

The OAuth `BrowserWindow` uses an isolated session partition (`oauth-temp`) so the app's CSP is not injected into Google's sign-in pages.

## Self-critique / what I cut

| Cut                                      | Why                                                     |
| ---------------------------------------- | ------------------------------------------------------- |
| Realtime sync (PocketBase subscriptions) | Nice-to-have; reload on focus/relaunch is enough for v1 |
| Virtualised message list                 | Not needed for demo-scale histories                     |
| Theme toggle                             | Bonus item; dark MUI theme only                         |
| Tailwind                                 | Opted for MUI speed; documented as gap                  |
| Streaming AI replies                     | Assignment explicitly says no streaming                 |
| Auto-update / error-logging collector    | Bonus items skipped                                     |
| Single-instance lock                     | Nice-to-have skipped                                    |

**Weakest area:** no E2E tests; OAuth requires manual Google Cloud + PocketBase admin setup. **Strongest area:** security defaults (contextIsolation, sandbox, safeStorage, typed preload, CSP) and honest scoping.

## Tests

Light Vitest coverage on pure optimistic-message helpers in `lib/chatMessages.test.ts` — append, finalize, rollback. Integration tests against PocketBase/mock-AI were not added to keep CI free of external services.
