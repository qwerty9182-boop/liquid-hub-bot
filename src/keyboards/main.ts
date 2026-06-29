import { InlineKeyboard } from "grammy";

import { config } from "../config.js";

export function createMainKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .webApp("🛒 Открыть магазин", config.webAppUrl)
    .row()
    .url("📢 Канал", config.channelUrl)
    .url("👨‍💼 Менеджер", config.managerUrl);
}
