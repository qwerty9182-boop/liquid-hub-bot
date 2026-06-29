import { config } from "../config.js";

type LogLevel = "debug" | "info" | "warn" | "error";

const priority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function shouldLog(level: LogLevel): boolean {
  return priority[level] >= priority[config.logLevel];
}

function serializeMeta(meta: unknown): string {
  if (meta === undefined) {
    return "";
  }

  if (meta instanceof Error) {
    return ` ${JSON.stringify({ name: meta.name, message: meta.message, stack: meta.stack })}`;
  }

  return ` ${JSON.stringify(meta)}`;
}

function write(level: LogLevel, message: string, meta?: unknown): void {
  if (!shouldLog(level)) {
    return;
  }

  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${level.toUpperCase()} ${message}${serializeMeta(meta)}`;

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  debug: (message: string, meta?: unknown) => write("debug", message, meta),
  info: (message: string, meta?: unknown) => write("info", message, meta),
  warn: (message: string, meta?: unknown) => write("warn", message, meta),
  error: (message: string, meta?: unknown) => write("error", message, meta)
};
