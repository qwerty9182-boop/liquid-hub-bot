# Liquid Hub Bot

Telegram bot and Railway backend for **Liquid Hub**.

## Architecture

Orders:

```text
Telegram Mini App -> POST /api/order on Railway -> bot.api.sendMessage(MANAGER_CHAT_ID)
```

Catalog:

```text
Telegram Mini App -> GET /api/products on Railway -> Supabase products table
```

The Mini App does not use `Telegram.WebApp.sendData()`.

## Stack

- Node.js 22
- TypeScript
- grammY
- dotenv
- pnpm
- Railway HTTP API
- Supabase REST API
- ESLint
- Prettier

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
BOT_TOKEN=
BOT_USERNAME=liquid_hub_bot
WEBAPP_URL=https://liquidhub.timurtafratov.workers.dev/
CHANNEL_URL=https://t.me/+kxBClTydKr9hNjc5
MANAGER_URL=https://t.me/liquid_hub_md
MANAGER_CHAT_ID=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PORT=3000
ALLOWED_ORIGINS=https://liquidhub.timurtafratov.workers.dev
TELEGRAM_INIT_DATA_MAX_AGE_SECONDS=86400
NODE_ENV=production
LOG_LEVEL=info
```

Important:

- `SUPABASE_SERVICE_ROLE_KEY` must exist only in Railway variables.
- Never put `SUPABASE_SERVICE_ROLE_KEY` into Cloudflare, frontend files, GitHub, or `config.js`.

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev
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

### Products

```http
GET /api/products
```

Returns only products where `in_stock = true`, sorted by `sort_order`, then `name`.

Response:

```json
{
  "success": true,
  "products": []
}
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
    "items": [
      {
        "productId": 1,
        "quantity": 2
      }
    ],
    "delivery": "Доставка",
    "phone": "+373...",
    "comment": "..."
  }
}
```

The backend verifies Telegram `initData`, loads product names and prices from Supabase, recalculates the total, validates stock, and sends the final order to `MANAGER_CHAT_ID`.

## Supabase

See [SETUP_SUPABASE.md](./SETUP_SUPABASE.md).

SQL files:

```text
supabase/migrations/001_create_products.sql
supabase/seed.sql
```

## Mini App Config

Cloudflare static files use:

```js
window.LIQUID_HUB_CONFIG = {
  orderApiUrl: "https://YOUR-RAILWAY-DOMAIN/api/order",
  productsApiUrl: "https://YOUR-RAILWAY-DOMAIN/api/products"
};
```

No secrets are stored in frontend config.

## Railway Deployment

1. Push this project to GitHub.
2. Open Railway.
3. Deploy from the GitHub repository.
4. Add all variables from `.env.example`.
5. Open:

```text
https://YOUR-RAILWAY-DOMAIN/health
```

Expected:

```json
{ "success": true, "status": "ok" }
```

Then test:

```text
https://YOUR-RAILWAY-DOMAIN/api/products
```

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
