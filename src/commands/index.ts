import type { Bot } from "grammy";

import { registerHelpCommand } from "./help.js";
import { registerStartCommand } from "./start.js";
import type { BotContext } from "../types/context.js";

export function registerCommands(bot: Bot<BotContext>): void {
  registerStartCommand(bot);
  registerHelpCommand(bot);
}
