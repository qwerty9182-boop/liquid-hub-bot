import type { Bot } from "grammy";

import { logger } from "../utils/logger.js";
import type { BotContext } from "../types/context.js";

export function registerCallbackHandlers(bot: Bot<BotContext>): void {
  bot.on("callback_query:data", async (ctx) => {
    logger.warn("Unhandled callback query", {
      userId: ctx.from?.id,
      data: ctx.callbackQuery.data
    });

    await ctx.answerCallbackQuery({
      text: "Этот раздел скоро появится."
    });
  });
}
