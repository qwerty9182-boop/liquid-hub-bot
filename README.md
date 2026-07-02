# Liquid Hub Bot

Telegram bot and Railway backend for **Liquid Hub**.

The Mini App no longer uses `Telegram.WebApp.sendData()`. Orders are sent through a normal HTTP API:

```text
Telegram Mini App -> POST /api/order on Railway -> bot.api.sendMessage(MANAGER_CHAT_ID)
```

## Stack

- Node.js 22
- TypeScript
- grammY
- dotenv
- pnpm
- Railway-ready HTTP API
- ESLint
- Prettier

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in:

```env
BOT_TOKEN=
BOT_USERNAME=liquid_hub_bot
WEBAPP_URL=https://liquidhub.timurtafratov.workers.dev/
CHANNEL_URL=https://t.me/+kxBClTydKr9hNjc5
MANAGER_URL=https://t.me/liquid_hub_md
MANAGER_CHAT_ID=
PORT=3000
ALLOWED_ORIGINS=https://liquidhub.timurtafratov.workers.dev
TELEGRAM_INIT_DATA_MAX_AGE_SECONDS=86400
NODE_ENV=production
LOG_LEVEL=info
```

`BOT_TOKEN` comes from [@BotFather](https://t.me/BotFather).

`MANAGER_CHAT_ID` is the Telegram chat id where orders will be sent.

`ALLOWED_ORIGINS` should contain the Mini App site origin. For a custom domain, add it too:

```env
ALLOWED_ORIGINS=https://liquidhub.timurtafratov.workers.dev,https://liquidhub.md
```

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

The API will run on:

```text
http://localhost:3000/api/order
```

## Production

```bash
pnpm build
pnpm start
```

## API

### Health

```http
GET /health
```

### Create Order

```http
POST /api/order
Content-Type: application/json
```

Body:

```json
{
  "initData": "Telegram.WebApp.initData",
  "order": {
    "type": "liquid_hub_order",
    "orderId": "LH-123",
    "items": [],
    "total": 200,
    "delivery": "Доставка",
    "phone": "+373...",
    "comment": "..."
  }
}
```

The backend verifies Telegram `initData`, extracts the Telegram user, formats the order, sends it to `MANAGER_CHAT_ID`, and returns:

```json
{ "success": true }
```

## Deployment to Railway

1. Push `liquid-hub-bot` to GitHub.
2. Create a new Railway project.
3. Deploy from the GitHub repository.
4. Add all environment variables from `.env.example`.
5. Make sure `NODE_ENV=production`.
6. Railway will provide a public domain, for example:

```text
https://liquid-hub-bot-production.up.railway.app
```

7. Open:

```text
https://YOUR-RAILWAY-DOMAIN/health
```

You should see:

```json
{ "success": true, "status": "ok" }
```

8. In the Mini App static site, edit `outputs/liquid-hub/config.js`:

```js
window.LIQUID_HUB_CONFIG = {
  orderApiUrl: "https://YOUR-RAILWAY-DOMAIN/api/order"
};
```

9. Redeploy the Mini App files to Cloudflare Pages.

## Code Quality

```bash
pnpm typecheck
pnpm lint
pnpm format:check
```

To format:

```bash
pnpm format
```

## Notes

- Do not commit `.env`.
- Keep secrets in Railway variables.
- The Mini App must be opened through the Telegram bot button so Telegram provides signed `initData`.
- Orders do not depend on `web_app_data`.
