# Mini Wallet Web App

Next.js + TypeScript simulation of a basic wallet flow: **Login → Home → New transfer →
Confirmation / Receipt**. All data is mocked behind the app's own API routes.

> The full README (architecture, decisions, testing, AI usage) is completed in TASK-22.

## Quick start

Requirements: Node.js ≥ 20.9.

```bash
npm install
cp .env.example .env.local   # then set SESSION_SECRET to a long random string
npm run dev                  # http://localhost:3000
```

## Demo accounts

Log in with any of these (phone **or** email). Outside production, the code step shows the
one-time code under the field (“Ambiente de prueba — código: …”): copy or paste it and press
“Verificar”. Any other phone or email is not a demo account: no code is shown for it.

| Use it to see                                                  | Phone        | Email                 |
| -------------------------------------------------------------- | ------------ | --------------------- |
| **Main flow** — balance $12,345.67, recent activity, favorites | `5512345678` | `ana@demo.mx`         |
| New user — $500.00, no activity, no favorites                  | `5500000001` | `nuevo@demo.mx`       |
| Zero balance — sending is blocked by the balance rule          | `5500000002` | `cero@demo.mx`        |
| Balance section fails to load (retry)                          | `5500000003` | `falla.saldo@demo.mx` |
| Activity section fails to load (retry)                         | `5500000004` | `falla.movs@demo.mx`  |
| Login service error                                            | `5500000005` | `falla.login@demo.mx` |

**Recommended for reviewers: `ana@demo.mx`.**

Demo aids (the code hint, forced outcomes) exist only when `MOCK_CONTROLS_ENABLED=true` and
`APP_ENV` is not `production`.

## Scripts

| Command                       | What it does                                         |
| ----------------------------- | ---------------------------------------------------- |
| `npm run dev`                 | Development server                                   |
| `npm run build` / `npm start` | Production build and server                          |
| `npm run check`               | Lint, type-check and unit/integration tests          |
| `npm run test:e2e`            | Playwright E2E (Chromium and WebKit, light and dark) |
