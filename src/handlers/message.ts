import type { Bot } from "grammy";

import {
  createChannelKeyboard,
  createManagerKeyboard,
  mainKeyboardButtons
} from "../keyboards/main.js";
import type { BotContext } from "../types/context.js";

export function registerMessageHandlers(bot: Bot<BotContext>): void {
  bot.hears(mainKeyboardButtons.channel, async (ctx) => {
    await ctx.reply("📢 Канал LIQUID HUB:", {
      reply_markup: createChannelKeyboard(),
      link_preview_options: {
        is_disabled: true
      }
    });
  });

  bot.hears(mainKeyboardButtons.manager, async (ctx) => {
    await ctx.reply("👨‍💼 Менеджер LIQUID HUB:", {
      reply_markup: createManagerKeyboard(),
      link_preview_options: {
        is_disabled: true
      }
    });
  });

  bot.on("message", async (ctx) => {
    await ctx.reply("Используй меню ниже для навигации 👇", {
      link_preview_options: {
        is_disabled: true
      }
    });
  });
}
