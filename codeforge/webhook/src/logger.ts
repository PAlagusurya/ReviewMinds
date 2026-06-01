const PREFIX = "[WEBHOOK]";

export const logger = {
  log: (message: string): void =>
    console.log(`${new Date().toISOString()} ${PREFIX} ${message}`),

  warn: (message: string): void =>
    console.warn(`${new Date().toISOString()} ${PREFIX} WARN ${message}`),

  error: (message: string, error?: unknown): void =>
    console.error(
      `${new Date().toISOString()} ${PREFIX} ERROR ${message}`,
      error ?? "",
    ),
};
