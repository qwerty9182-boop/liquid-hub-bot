import { config } from "../config.js";
import type { Product } from "./products.js";
import type { TelegramInitDataUser } from "./telegramInitData.js";

const MAX_ITEMS_PER_ORDER = 50;
const MAX_QUANTITY_PER_ITEM = 20;

export type LiquidHubOrderRequest = {
  type: "liquid_hub_order";
  orderId: string;
  createdAt: string;
  phone: string | null;
  delivery: string;
  comment: string | null;
  items: {
    productId: number;
    quantity: number;
  }[];
};

export type LiquidHubOrder = {
  type: "liquid_hub_order";
  orderId: string;
  createdAt: string;
  customer: {
    telegram: {
      id: number;
      username: string | null;
      firstName: string | null;
    };
    phone: string | null;
  };
  items: {
    productId: number;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }[];
  total: number;
  delivery: string;
  comment: string | null;
};

export type OrderBuildResult =
  | {
      ok: true;
      order: LiquidHubOrder;
    }
  | {
      ok: false;
      statusCode: number;
      error: string;
      message: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeNullableText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseProductId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }

  return null;
}

function parseQuantity(value: unknown): number | null {
  if (!Number.isInteger(value) || typeof value !== "number" || value <= 0) {
    return null;
  }

  return value;
}

export function parseLiquidHubOrder(rawData: string): LiquidHubOrderRequest | null {
  let value: unknown;

  try {
    value = JSON.parse(rawData);
  } catch {
    return null;
  }

  if (
    !isRecord(value) ||
    value.type !== "liquid_hub_order" ||
    typeof value.orderId !== "string" ||
    typeof value.delivery !== "string" ||
    !Array.isArray(value.items) ||
    !value.items.length ||
    value.items.length > MAX_ITEMS_PER_ORDER
  ) {
    return null;
  }

  const items: LiquidHubOrderRequest["items"] = [];

  for (const item of value.items) {
    if (!isRecord(item)) {
      return null;
    }

    const productId = parseProductId(item.productId);
    const quantity = parseQuantity(item.quantity);

    if (!productId || !quantity || quantity > MAX_QUANTITY_PER_ITEM) {
      return null;
    }

    items.push({
      productId,
      quantity
    });
  }

  return {
    type: "liquid_hub_order",
    orderId: value.orderId,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    phone: normalizeNullableText(value.phone),
    delivery: value.delivery,
    comment: normalizeNullableText(value.comment),
    items
  };
}

export function buildOrderFromProducts(
  request: LiquidHubOrderRequest,
  user: TelegramInitDataUser,
  productsById: Map<number, Product>
): OrderBuildResult {
  const quantitiesByProductId = new Map<number, number>();

  for (const item of request.items) {
    quantitiesByProductId.set(
      item.productId,
      (quantitiesByProductId.get(item.productId) ?? 0) + item.quantity
    );
  }

  const lines: LiquidHubOrder["items"] = [];

  for (const [productId, quantity] of quantitiesByProductId.entries()) {
    const product = productsById.get(productId);

    if (!product?.inStock) {
      return {
        ok: false,
        statusCode: 409,
        error: "product_unavailable",
        message: `Товар #${productId} сейчас недоступен. Обновите каталог и попробуйте снова.`
      };
    }

    if (quantity > MAX_QUANTITY_PER_ITEM) {
      return {
        ok: false,
        statusCode: 400,
        error: "quantity_limit_exceeded",
        message: `Максимум ${MAX_QUANTITY_PER_ITEM} шт. одного товара в заказе.`
      };
    }

    if (product.stockQuantity !== null && quantity > product.stockQuantity) {
      return {
        ok: false,
        statusCode: 409,
        error: "not_enough_stock",
        message: `Недостаточно товара "${product.name}" в наличии.`
      };
    }

    lines.push({
      productId,
      name: product.name,
      price: product.price,
      quantity,
      total: product.price * quantity
    });
  }

  const total = lines.reduce((sum, item) => sum + item.total, 0);

  return {
    ok: true,
    order: {
      type: "liquid_hub_order",
      orderId: request.orderId,
      createdAt: request.createdAt,
      customer: {
        telegram: {
          id: user.id,
          username: user.username,
          firstName: user.firstName
        },
        phone: request.phone
      },
      items: lines,
      total,
      delivery: request.delivery,
      comment: request.comment
    }
  };
}

function formatPrice(value: number): string {
  return `${value} MDL`;
}

export function formatOrderForManager(order: LiquidHubOrder): string {
  const items = order.items
    .map((item, index) => {
      return `${index + 1}. ${item.name}\n   ID: ${item.productId}\n   Кол-во: ${item.quantity}\n   Цена: ${formatPrice(item.price)}\n   Сумма: ${formatPrice(item.total)}`;
    })
    .join("\n\n");

  return [
    "🛒 Новый заказ LIQUID HUB",
    "",
    `Номер заказа: ${order.orderId}`,
    `Дата: ${new Date(order.createdAt).toLocaleString("ru-RU", { timeZone: "Europe/Chisinau" })}`,
    "",
    "👤 Клиент",
    `Telegram ID: ${order.customer.telegram.id}`,
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
