/* Lightweight client logger with env-based routing: dev -> console, prod -> telemetry (optional) */

export type LogLevel = "error" | "warn" | "info" | "debug";

const isBrowser = typeof window !== "undefined";
const isDev = process.env.NODE_ENV !== "production" || (isBrowser && window.localStorage?.getItem("app:debug") === "1");

// Optional telemetry endpoint (set NEXT_PUBLIC_LOG_ENDPOINT in env to enable)
const TELEMETRY_ENDPOINT = process.env.NEXT_PUBLIC_LOG_ENDPOINT;

function genId() {
  // Simple unique-ish id for correlation
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${Date.now().toString(36)}-${rnd}`;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, (_key, val) => {
      if (val instanceof Error) {
        return { name: val.name, message: val.message, stack: val.stack };
      }
      // redact long token-like strings
      if (typeof val === "string" && val.length > 0) {
        // redact common PII keys if present in JSON-like strings
        const redacted = val
          .replace(/[A-Za-z0-9-_]{32,}/g, "[redacted]")
          .replace(/(authorization|token|password|secret)\s*[:=]\s*[^,\s]+/gi, "$1:[redacted]");
        return redacted.length > 2000 ? redacted.slice(0, 2000) + "…" : redacted;
      }
      return val;
    });
  } catch {
    return String(value);
  }
}

async function postTelemetry(payload: Record<string, unknown>) {
  if (!isBrowser || !TELEMETRY_ENDPOINT) return;
  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(TELEMETRY_ENDPOINT, blob);
      return;
    }
  } catch {
    // ignore beacon errors, try fetch below
  }

  try {
    await fetch(TELEMETRY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // fail silently; logging must never break UX
  }
}

function baseLog(level: LogLevel, args: unknown[]) {
  const id = genId();

  if (isDev) {
    // In dev, mirror to console for best DX
    const c: { [key: string]: (...args: unknown[]) => void } = console;
    const fn = typeof c[level] === "function" ? c[level] : c.log;
    try {
      fn(`[${level.toUpperCase()}]`, ...args, `#${id}`);
    } catch {
      // ignore console failures
    }
  }

  // In prod, send telemetry only (console noise avoided)
  if (!isDev) {
    const [message, ...rest] = args as unknown[];
    const payload = {
      id,
      level,
      message: typeof message === "string" ? message : safeStringify(message),
      meta: rest.length ? safeStringify(rest) : undefined,
      url: isBrowser ? window.location.href : undefined,
      userAgent: isBrowser ? navigator.userAgent : undefined,
      ts: Date.now(),
      app: "frontend-website",
      version: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
    };
    void postTelemetry(payload);
  }

  return id;
}

export const logger = {
  error: (...args: unknown[]) => baseLog("error", args),
  warn: (...args: unknown[]) => baseLog("warn", args),
  info: (...args: unknown[]) => baseLog("info", args),
  debug: (...args: unknown[]) => baseLog("debug", args),
};

export default logger;