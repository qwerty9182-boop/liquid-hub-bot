import type { Bot } from "grammy";

import { registerCallbackHandlers } from "./callback.js";
import { registerMessageHandlers } from "./message.js";
import type { BotContext } from "../types/context.js";

export function registerHandlers(bot: Bot<BotContext>): void {
  registerCallbackHandlers(bot);
  registerMessageHandlers(bot);
}
