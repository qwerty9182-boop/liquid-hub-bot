import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

import type { Bot } from "grammy";

import { config } from "../config.js";
import {
  formatOrderForManager,
  getManagerChatId,
  parseLiquidHubOrder,
  withTelegramUser
} from "../services/orders.js";
import { verifyTelegramInitData } from "../services/telegramInitData.js";
import type { BotContext } from "../types/context.js";
import { logger } from "../utils/logger.js";

const MAX_BODY_BYTES = 64 * 1024;

type OrderRequestBody = {
  initData?: unknown;
  telegramInitData?: unknown;
  order?: unknown;
};

function isAllowedOrigin(origin: string | undefined): boolean {
  return (
    config.allowedOrigins.includes("*") || (origin ? config.allowedOrigins.includes(origin) : true)
  );
}

function applyCorsHeaders(req: IncomingMessage, res: ServerResponse): void {
  const origin = req.headers.origin;
  const resolvedOrigin =
    typeof origin === "string" && isAllowedOrigin(origin) && !config.allowedOrigins.includes("*")
      ? origin
      : "*";

  res.setHeader("Access-Control-Allow-Origin", resolvedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    req.on("data", (chunk: Buffer) => {
      totalBytes += chunk.length;

      if (totalBytes > MAX_BODY_BYTES) {
        reject(new Error("request_body_too_large"));
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        const rawBody = Buffer.concat(chunks).toString("utf8");
        resolve(rawBody ? JSON.parse(rawBody) : {});
      } catch {
        reject(new Error("invalid_json"));
      }
    });

    req.on("error", reject);
  });
}

function isOrderRequestBody(value: unknown): value is OrderRequestBody {
  return typeof value === "object" && value !== null;
}

function readTelegramInitData(body: OrderRequestBody): string | null {
  if (typeof body.initData === "string") {
    return body.initData;
  }

  if (typeof body.telegramInitData === "string") {
    return body.telegramInitData;
  }

  return null;
}

async function handleOrderRequest(
  bot: Bot<BotContext>,
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : undefined;

  if (!isAllowedOrigin(origin)) {
    logger.warn("Rejected order request from disallowed origin", { origin });
    sendJson(res, 403, {
      success: false,
      error: "origin_not_allowed"
    });
    return;
  }

  let body: unknown;

  try {
    body = await readJsonBody(req);
  } catch (error) {
    logger.warn("Invalid order request body", {
      error: error instanceof Error ? error.message : String(error)
    });
    sendJson(res, 400, {
      success: false,
      error: "invalid_request_body"
    });
    return;
  }

  if (!isOrderRequestBody(body)) {
    sendJson(res, 400, {
      success: false,
      error: "missing_init_data"
    });
    return;
  }

  const initData = readTelegramInitData(body);

  if (!initData) {
    logger.warn("Rejected order request without Telegram initData", { origin });
    sendJson(res, 400, {
      success: false,
      error: "missing_init_data"
    });
    return;
  }

  const verification = verifyTelegramInitData(
    initData,
    config.botToken,
    config.telegramInitDataMaxAgeSeconds
  );

  if (!verification.ok) {
    logger.warn("Rejected order request with invalid Telegram initData", {
      reason: verification.reason,
      origin
    });
    sendJson(res, 401, {
      success: false,
      error: verification.reason
    });
    return;
  }

  const order = parseLiquidHubOrder(JSON.stringify(body.order));

  if (!order) {
    logger.warn("Rejected invalid order payload", {
      telegramId: verification.user.id
    });
    sendJson(res, 400, {
      success: false,
      error: "invalid_order"
    });
    return;
  }

  const managerChatId = getManagerChatId();

  if (!managerChatId) {
    logger.error("MANAGER_CHAT_ID is not configured");
    sendJson(res, 500, {
      success: false,
      error: "manager_chat_not_configured"
    });
    return;
  }

  const verifiedOrder = withTelegramUser(order, verification.user);

  try {
    await bot.api.sendMessage(managerChatId, formatOrderForManager(verifiedOrder), {
      link_preview_options: {
        is_disabled: true
      }
    });
  } catch (error) {
    logger.error("Failed to send order to manager", {
      orderId: verifiedOrder.orderId,
      telegramId: verification.user.id,
      error: error instanceof Error ? error.message : String(error)
    });
    sendJson(res, 502, {
      success: false,
      error: "manager_notification_failed"
    });
    return;
  }

  logger.info("Order sent to manager through HTTP API", {
    orderId: verifiedOrder.orderId,
    telegramId: verification.user.id,
    username: verification.user.username,
    total: verifiedOrder.total
  });

  sendJson(res, 200, {
    success: true
  });
}

export function createOrderServer(bot: Bot<BotContext>): Server {
  return createServer((req, res) => {
    applyCorsHeaders(req, res);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, {
        success: true,
        status: "ok"
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/order") {
      void handleOrderRequest(bot, req, res);
      return;
    }

    sendJson(res, 404, {
      success: false,
      error: "not_found"
    });
  });
}

export function listenOrderServer(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.listen(config.port, () => {
      logger.info("HTTP API server is running", {
        port: config.port,
        allowedOrigins: config.allowedOrigins
      });
      resolve();
    });
  });
}
