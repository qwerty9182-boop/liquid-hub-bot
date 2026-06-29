import type { Bot } from "grammy";

import type { BotContext } from "../types/context.js";
import { logger } from "../utils/logger.js";

export async function registerTelegramCommands(bot: Bot<BotContext>): Promise<void> {
  await bot.api.setMyCommands([
    {
      command: "start",
      description: "Open main menu"
    },
    {
      command: "help",
      description: "Help information"
    }
  ]);

  logger.info("Telegram commands registered");
}
