import "dotenv/config";

export type AppConfig = {
  botToken: string;
  botUsername: string;
  webAppUrl: string;
  channelUrl: string;
  managerUrl: string;
  managerChatId?: string;
  port: number;
  allowedOrigins: string[];
  telegramInitDataMaxAgeSeconds: number;
  nodeEnv: "development" | "test" | "production";
  logLevel: "debug" | "info" | "warn" | "error";
};

const allowedNodeEnvs = ["development", "test", "production"] as const;
const allowedLogLevels = ["debug", "info", "warn", "error"] as const;

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readOptionalEnv(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

function readIntegerEnv(name: string, fallback: number): number {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return fallback;
  }

  const value = Number.parseInt(rawValue, 10);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return value;
}

function readCsvEnv(name: string, fallback: string[]): string[] {
  const value = process.env[name]?.trim();

  if (!value) {
    return fallback;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readUrlEnv(name: string): string {
  const value = readRequiredEnv(name);

  try {
    return new URL(value).toString();
  } catch {
    throw new Error(`Environment variable ${name} must be a valid URL`);
  }
}

function readEnumEnv<TValue extends readonly string[]>(
  name: string,
  fallback: TValue[number],
  allowedValues: TValue
): TValue[number] {
  const value = readOptionalEnv(name, fallback);

  if (!allowedValues.includes(value)) {
    throw new Error(`${name} must be one of: ${allowedValues.join(", ")}`);
  }

  return value;
}

export const config: AppConfig = {
  botToken: readRequiredEnv("BOT_TOKEN"),
  botUsername: readOptionalEnv("BOT_USERNAME", "liquid_hub_bot"),
  webAppUrl: readUrlEnv("WEBAPP_URL"),
  channelUrl: readUrlEnv("CHANNEL_URL"),
  managerUrl: readUrlEnv("MANAGER_URL"),
  managerChatId: process.env.MANAGER_CHAT_ID?.trim() || undefined,
  port: readIntegerEnv("PORT", 3000),
  allowedOrigins: readCsvEnv("ALLOWED_ORIGINS", ["*"]),
  telegramInitDataMaxAgeSeconds: readIntegerEnv("TELEGRAM_INIT_DATA_MAX_AGE_SECONDS", 86_400),
  nodeEnv: readEnumEnv("NODE_ENV", "development", allowedNodeEnvs),
  logLevel: readEnumEnv("LOG_LEVEL", "info", allowedLogLevels)
};
