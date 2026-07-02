import { Bot } from "grammy";

import { registerCommands } from "./commands/index.js";
import { config } from "./config.js";
import { registerHandlers } from "./handlers/index.js";
import type { BotContext } from "./types/context.js";
import { logger } from "./utils/logger.js";

export function createBot(): Bot<BotContext> {
  const bot = new Bot<BotContext>(config.botToken);

  registerCommands(bot);
  registerHandlers(bot);

  bot.catch((error) => {
    logger.error("Bot update failed", {
      error: error.error instanceof Error ? error.error.message : String(error.error),
      update: error.ctx.update
    });
  });

  return bot;
}
