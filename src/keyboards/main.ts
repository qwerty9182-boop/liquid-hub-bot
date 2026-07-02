import { InlineKeyboard } from "grammy";
import type { ReplyKeyboardMarkup } from "grammy/types";

import { config } from "../config.js";

export const mainKeyboardButtons = {
  openStore: "🛒 Открыть магазин",
  channel: "📢 Канал",
  manager: "👨‍💼 Менеджер"
} as const;

export function createMainReplyKeyboard(): ReplyKeyboardMarkup {
  return {
    keyboard: [
      [
        {
          text: mainKeyboardButtons.openStore,
          web_app: {
            url: config.webAppUrl
          }
        }
      ],
      [
        {
          text: mainKeyboardButtons.channel
        },
        {
          text: mainKeyboardButtons.manager
        }
      ]
    ],
    resize_keyboard: true,
    is_persistent: true,
    one_time_keyboard: false
  };
}

export function createStoreInlineKeyboard(): InlineKeyboard {
  return new InlineKeyboard().webApp("🛒 Открыть магазин", config.webAppUrl);
}

export function createChannelKeyboard(): InlineKeyboard {
  return new InlineKeyboard().url("📢 Открыть канал", config.channelUrl);
}

export function createManagerKeyboard(): InlineKeyboard {
  return new InlineKeyboard().url("👨‍💼 Написать менеджеру", config.managerUrl);
}
