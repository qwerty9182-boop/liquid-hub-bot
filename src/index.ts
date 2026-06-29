import { createBot } from "./bot.js";
import { config } from "./config.js";
import { registerTelegramCommands } from "./services/telegramCommands.js";
import { logger } from "./utils/logger.js";

const bot = createBot();

function setupProcessErrorHandlers(): void {
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection", reason);
  });

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception", error);
    process.exit(1);
  });
}

function setupGracefulShutdown(): void {
  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    logger.info(`Received ${signal}. Stopping bot...`);
    await bot.stop();
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
  setupGracefulShutdown();

  logger.info("Starting Liquid Hub bot", {
    botUsername: config.botUsername,
    nodeEnv: config.nodeEnv,
    webAppUrl: config.webAppUrl
  });

  await registerTelegramCommands(bot);
  await bot.start({
    onStart: (botInfo) => {
      logger.info("Bot is running", {
        id: botInfo.id,
        username: botInfo.username
      });
    }
  });
}

await main();
