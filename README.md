# Liquid Hub Bot

Production-ready Telegram bot for **Liquid Hub**.

The bot opens the Liquid Hub Telegram Mini App and gives quick access to the store channel and manager.

## Stack

- Node.js 22
- TypeScript
- grammY
- dotenv
- pnpm
- ESLint
- Prettier
- Railway-ready deployment

## Project Structure

```text
src/
  index.ts
  bot.ts
  config.ts
  commands/
  handlers/
  keyboards/
  messages/
  services/
  types/
  utils/
```

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in the variables:

```env
BOT_TOKEN=
BOT_USERNAME=liquid_hub_bot
WEBAPP_URL=https://liquidhub.timurtafratov.workers.dev/
CHANNEL_URL=https://t.me/+kxBClTydKr9hNjc5
MANAGER_URL=https://t.me/defvbg
NODE_ENV=development
LOG_LEVEL=info
```

`BOT_TOKEN` is required. Get it from [@BotFather](https://t.me/BotFather).

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

## Code Quality

```bash
pnpm typecheck
pnpm lint
pnpm format:check
```

To format files:

```bash
pnpm format
```

## Telegram Commands

The bot registers:

- `/start` — Open main menu
- `/help` — Help information

## Mini App Button

The main inline button uses Telegram WebApp:

```text
🛒 Открыть магазин
```

It opens:

```text
https://liquidhub.timurtafratov.workers.dev/
```

## Deployment to Railway

1. Push this project to GitHub.
2. Open [Railway](https://railway.app/).
3. Create a new project.
4. Choose **Deploy from GitHub repo**.
5. Select the repository.
6. Add environment variables in Railway:

```env
BOT_TOKEN=
BOT_USERNAME=liquid_hub_bot
WEBAPP_URL=https://liquidhub.timurtafratov.workers.dev/
CHANNEL_URL=https://t.me/+kxBClTydKr9hNjc5
MANAGER_URL=https://t.me/defvbg
NODE_ENV=production
LOG_LEVEL=info
```

7. Railway will build the project with Nixpacks.
8. Start command:

```bash
pnpm start
```

The included `railway.json` already defines the production start command.

## Deployment to GitHub

Create a repository and push:

```bash
git init
git add .
git commit -m "Initial Liquid Hub bot"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/liquid-hub-bot.git
git push -u origin main
```

GitHub Actions will run:

- typecheck
- lint
- formatting check
- build

## Future Expansion

The architecture is prepared for:

- promo codes
- mailing
- statistics
- admin panel
- order notifications
- database integration

Recommended next folders when features grow:

```text
src/modules/
src/repositories/
src/database/
src/admin/
src/jobs/
```

## Notes

- Do not commit `.env`.
- Keep secrets in Railway environment variables.
- Use HTTPS URLs for Telegram Mini Apps.
