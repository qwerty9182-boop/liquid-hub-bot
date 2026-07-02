import type { Bot } from "grammy";

import { createMainInlineKeyboard } from "../keyboards/main.js";
import type { BotContext } from "../types/context.js";

export function registerMessageHandlers(bot: Bot<BotContext>): void {
  bot.on("message", async (ctx) => {
    await ctx.reply("Используй кнопки ниже для навигации 👇", {
      reply_markup: createMainInlineKeyboard(),
      link_preview_options: {
        is_disabled: true
      }
    });
  });
}
