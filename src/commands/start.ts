import type { Bot } from "grammy";

import { createMainReplyKeyboard } from "../keyboards/main.js";
import { welcomeMessage } from "../messages/welcome.js";
import type { BotContext } from "../types/context.js";

export function registerStartCommand(bot: Bot<BotContext>): void {
  bot.command("start", async (ctx) => {
    await ctx.api.sendMessage(8322108990, "✅ TEST FROM BOT");
    await ctx.reply(welcomeMessage, {
      reply_markup: createMainReplyKeyboard(),
      link_preview_options: {
        is_disabled: true
      }
    });
  });
}