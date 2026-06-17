# AI Chat Desktop

Electron + React 19 + TypeScript desktop chat client backed by PocketBase.

## Prerequisites

- Node.js 20+
- macOS (PocketBase binary included is `darwin_arm64`; Intel Macs: download the matching binary from [PocketBase releases](https://github.com/pocketbase/pocketbase/releases) and replace `pocketbase/pocketbase`)

## Quick start (clean checkout)

```bash
# 1. Install dependencies
npm install

# 2. Start PocketBase (keep running)
cd pocketbase && ./pocketbase serve --http=127.0.0.1:8090

# 3. In a new terminal — start mock AI (keep running)
npm run mock-ai

# 4. In a new terminal — start the app
npm run dev
```

On first PocketBase launch, create a superuser via the install URL printed in the terminal (or `./pocketbase superuser upsert EMAIL PASS`).

### First use

1. Sign up or sign in with email/password.
2. Create a conversation from the sidebar (+).
3. Send a message — the mock AI echoes it back as Markdown.
4. Quit and relaunch the app — session, conversations, and messages should restore.

## PocketBase

The PocketBase binary and schema migrations live in `pocketbase/`. Migrations in `pocketbase/pb_migrations/` run automatically on first start — no manual Admin UI setup required for collections.

**macOS start command** (from repo root):

```bash
cd pocketbase && ./pocketbase serve --http=127.0.0.1:8090
```

- REST API: `http://127.0.0.1:8090/api/`
- Admin dashboard: `http://127.0.0.1:8090/_/`
- Renderer client URL: `http://127.0.0.1:8090` (matches CSP `connect-src`)

Local database files are written to `pocketbase/pb_data/` (gitignored).

## Mock AI server

Tiny local Node HTTP server — no framework. Echoes the user's message as Markdown (bold + bullet list).

```bash
npm run mock-ai
```

Listens on `http://127.0.0.1:8787` (matches CSP `connect-src`).

## Scripts

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `npm run dev`       | Start Electron app in development |
| `npm run mock-ai`   | Start mock AI server              |
| `npm run build`     | Typecheck + production build      |
| `npm run test`      | Run Vitest unit tests             |
| `npm run lint`      | ESLint                            |
| `npm run typecheck` | TypeScript (`tsc --noEmit`)       |

## Build

```bash
npm run build
npm start          # preview production build
```

Platform-specific installers: `npm run build:mac` / `build:win` / `build:linux`.

## Google OAuth setup

Google credentials are configured in **PocketBase** (not in this repo). Nothing secret is committed.

### 1. Create a Google OAuth client

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. **Create Credentials** → **OAuth client ID** → type **Web application**.
3. Set:
   - **Authorized JavaScript origins:** `http://127.0.0.1:8090`
   - **Authorized redirect URIs:** `http://127.0.0.1:8090/api/oauth2-redirect`
4. Copy the **Client ID** and **Client Secret**.

### 2. Enable Google in PocketBase

1. Open PocketBase admin: `http://127.0.0.1:8090/_/`
2. **Collections** → **users** → settings (gear) → **Options** → **OAuth2**
3. Add provider **Google**, paste Client ID + Client Secret, save.

### 3. Sign in from the app

On the login screen, click **Continue with Google**. A sandboxed Electron window opens the Google flow; the redirect is intercepted, the code is exchanged via the PocketBase SDK, and the token is stored via `safeStorage` (same path as email/password).

## Known gaps / not working yet

- **Automated E2E tests** — only light unit tests on optimistic message logic; no Playwright/Spectron coverage.
- **Linux/Windows PocketBase binaries** — only macOS `darwin_arm64` binary is bundled; other platforms need a manual binary swap.

See `NOTES.md` for architecture, trade-offs, and what was intentionally cut.
