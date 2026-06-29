import type { Bot } from "grammy";

import { createMainKeyboard } from "../keyboards/main.js";
import type { BotContext } from "../types/context.js";

export function registerMessageHandlers(bot: Bot<BotContext>): void {
  bot.on("message", async (ctx) => {
    await ctx.reply("Выберите нужный раздел👇", {
      reply_markup: createMainKeyboard(),
      link_preview_options: {
        is_disabled: true
      }
    });
  });
}
