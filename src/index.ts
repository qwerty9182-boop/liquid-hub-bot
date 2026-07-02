import type { Server } from "node:http";

import { createOrderServer, listenOrderServer } from "./api/orderServer.js";
import { createBot } from "./bot.js";
import { config } from "./config.js";
import { registerTelegramCommands } from "./services/telegramCommands.js";
import { logger } from "./utils/logger.js";

const bot = createBot();

logger.info("CONFIG CHECK", {
  managerChatId: config.managerChatId,
  botUsername: config.botUsername,
  webAppUrl: config.webAppUrl,
  port: config.port
});

function setupProcessErrorHandlers(): void {
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection", reason);
  });

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception", error);
    process.exit(1);
  });
}

function setupGracefulShutdown(apiServer: Server): void {
  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    logger.info(`Received ${signal}. Stopping services...`);
    await bot.stop();
    await new Promise<void>((resolve, reject) => {
      apiServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
    logger.info("Bot stopped");
    process.exit(0);
  };

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

async function main(): Promise<void> {
  setupProcessErrorHandlers();

  logger.info("Starting Liquid Hub bot", {
    botUsername: config.botUsername,
    nodeEnv: config.nodeEnv,
    webAppUrl: config.webAppUrl,
    port: config.port
  });

  const apiServer = createOrderServer(bot);
  await listenOrderServer(apiServer);
  setupGracefulShutdown(apiServer);

  await registerTelegramCommands(bot);
  await bot.start({
    allowed_updates: ["message"],
    onStart: (botInfo) => {
      logger.info("Bot is running", {
        id: botInfo.id,
        username: botInfo.username
      });
    }
  });
}

await main();
