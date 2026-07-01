import type { Bot } from "grammy";

import { helpMessage } from "../messages/welcome.js";
import type { BotContext } from "../types/context.js";

export function registerHelpCommand(bot: Bot<BotContext>): void {
  bot.command("help", async (ctx) => {
    await ctx.reply(helpMessage, {
      link_preview_options: {
        is_disabled: true
      }
    });
  });
}
