import type { Bot } from "grammy";

import {
  createChannelKeyboard,
  createManagerKeyboard,
  mainKeyboardButtons
} from "../keyboards/main.js";
import {
  formatOrderForManager,
  getManagerChatId,
  parseLiquidHubOrder
} from "../services/orders.js";
import type { BotContext } from "../types/context.js";
import { logger } from "../utils/logger.js";

async function handleWebAppData(ctx: BotContext, rawData: string): Promise<void> {
  logger.info("Web app order data received", {
    userId: ctx.from?.id,
    payloadLength: rawData.length
  });

  const order = parseLiquidHubOrder(rawData);

  if (!order) {
    logger.warn("Invalid web app data received", {
      userId: ctx.from?.id
    });

    await ctx.reply("Не удалось обработать заказ. Пожалуйста, напишите менеджеру.");
    return;
  }

  const managerChatId = getManagerChatId();

  if (!managerChatId) {
    logger.error("MANAGER_CHAT_ID is not configured");
    await ctx.reply(
      "Заказ сформирован, но отправка менеджеру пока не настроена. Напишите менеджеру напрямую."
    );
    return;
  }

  await ctx.api.sendMessage(managerChatId, formatOrderForManager(order), {
    link_preview_options: {
      is_disabled: true
    }
  });

  logger.info("Order sent to manager", {
    orderId: order.orderId,
    userId: ctx.from?.id,
    total: order.total
  });

  await ctx.reply(
    "✅ Заказ отправлен менеджеру. Мы свяжемся с вами в ближайшее время для подтверждения."
  );
}

export function registerMessageHandlers(bot: Bot<BotContext>): void {
  bot.on("message:web_app_data", async (ctx) => {
    logger.info("message:web_app_data fired");
    await handleWebAppData(ctx, ctx.message.web_app_data.data);
  });

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
    logger.info("Generic message received", ctx.message);

    if (ctx.message?.web_app_data?.data) {
      logger.warn("Web app data reached generic message handler fallback", {
        userId: ctx.from?.id
      });

      await handleWebAppData(ctx, ctx.message.web_app_data.data);
      return;
    }

    await ctx.reply("Используй меню ниже для навигации 👇", {
      link_preview_options: {
        is_disabled: true
      }
    });
  });
}
