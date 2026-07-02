import { config } from "../config.js";
import type { TelegramInitDataUser } from "./telegramInitData.js";

export type LiquidHubOrder = {
  type: "liquid_hub_order";
  orderId: string;
  createdAt: string;
  customer: {
    telegram: {
      id: number | null;
      username: string | null;
      firstName: string | null;
    };
    phone: string | null;
  };
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }[];
  total: number;
  delivery: string;
  comment: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOrderItem(value: unknown): value is LiquidHubOrder["items"][number] {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.price === "number" &&
    typeof value.quantity === "number" &&
    typeof value.total === "number"
  );
}

function isCompactOrderItem(value: unknown): value is [string, number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    typeof value[0] === "string" &&
    typeof value[1] === "number" &&
    typeof value[2] === "number" &&
    typeof value[3] === "number"
  );
}

export function parseLiquidHubOrder(rawData: string): LiquidHubOrder | null {
  let value: unknown;

  try {
    value = JSON.parse(rawData);
  } catch {
    return null;
  }

  if (!isRecord(value) || value.type !== "liquid_hub_order") {
    return null;
  }

  if (
    typeof value.orderId === "string" &&
    typeof value.total === "number" &&
    typeof value.delivery === "string" &&
    Array.isArray(value.items) &&
    value.items.every(isCompactOrderItem)
  ) {
    const telegram = isRecord(value.tg) ? value.tg : {};
    const phone = value.phone;
    const comment = value.comment;

    return {
      type: "liquid_hub_order",
      orderId: value.orderId,
      createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
      customer: {
        telegram: {
          id: typeof telegram.id === "number" ? telegram.id : null,
          username: typeof telegram.u === "string" ? telegram.u : null,
          firstName: typeof telegram.n === "string" ? telegram.n : null
        },
        phone: typeof phone === "string" ? phone : null
      },
      items: value.items.map(([name, price, quantity, total], index) => ({
        id: `item-${index}`,
        name,
        price,
        quantity,
        total
      })),
      total: value.total,
      delivery: value.delivery,
      comment: typeof comment === "string" ? comment : null
    };
  }

  if (
    typeof value.orderId !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.total !== "number" ||
    typeof value.delivery !== "string" ||
    !Array.isArray(value.items) ||
    !value.items.every(isOrderItem) ||
    !isRecord(value.customer) ||
    !isRecord(value.customer.telegram)
  ) {
    return null;
  }

  const telegram = value.customer.telegram;
  const phone = value.customer.phone;
  const comment = value.comment;

  return {
    type: "liquid_hub_order",
    orderId: value.orderId,
    createdAt: value.createdAt,
    customer: {
      telegram: {
        id: typeof telegram.id === "number" ? telegram.id : null,
        username: typeof telegram.username === "string" ? telegram.username : null,
        firstName: typeof telegram.firstName === "string" ? telegram.firstName : null
      },
      phone: typeof phone === "string" ? phone : null
    },
    items: value.items,
    total: value.total,
    delivery: value.delivery,
    comment: typeof comment === "string" ? comment : null
  };
}

export function withTelegramUser(
  order: LiquidHubOrder,
  user: TelegramInitDataUser
): LiquidHubOrder {
  return {
    ...order,
    customer: {
      ...order.customer,
      telegram: {
        id: user.id,
        username: user.username,
        firstName: user.firstName
      }
    }
  };
}

function formatPrice(value: number): string {
  return `${value} MDL`;
}

export function formatOrderForManager(order: LiquidHubOrder): string {
  const items = order.items
    .map((item, index) => {
      return `${index + 1}. ${item.name}\n   Кол-во: ${item.quantity}\n   Цена: ${formatPrice(item.price)}\n   Сумма: ${formatPrice(item.total)}`;
    })
    .join("\n\n");

  return [
    "🛒 Новый заказ LIQUID HUB",
    "",
    `Номер заказа: ${order.orderId}`,
    `Дата: ${new Date(order.createdAt).toLocaleString("ru-RU", { timeZone: "Europe/Chisinau" })}`,
    "",
    "👤 Клиент",
    order.customer.telegram.id
      ? `Telegram ID: ${order.customer.telegram.id}`
      : "Telegram ID: не получен",
    order.customer.telegram.username
      ? `Username: @${order.customer.telegram.username}`
      : "Username: не указан",
    order.customer.telegram.firstName
      ? `Имя: ${order.customer.telegram.firstName}`
      : "Имя: не указано",
    order.customer.phone ? `Телефон: ${order.customer.phone}` : "Телефон: не указан",
    "",
    "📦 Товары",
    items,
    "",
    `Итого: ${formatPrice(order.total)}`,
    `Получение: ${order.delivery}`,
    order.comment ? `Комментарий: ${order.comment}` : "Комментарий: не указан"
  ].join("\n");
}

export function getManagerChatId(): string | undefined {
  return config.managerChatId;
}
