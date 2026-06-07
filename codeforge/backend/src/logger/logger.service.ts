import { ConsoleLogger, Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';

const SENSITIVE_KEYS = new Set([
  'token',
  'secret',
  'password',
  'accesstoken',
  'authorization',
]);

const MAX_REDACT_DEPTH = 5;

// Scope.Transient ensures that a new Logger Instance is injected
// in every call site. If it is not there the instance creation
// defaults to singleton which is unreliable/stale with INQUIRER
@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger extends ConsoleLogger {
  constructor(@Inject(INQUIRER) parentClass: object) {
    super(parentClass?.constructor?.name ?? 'App');
  }

  override log(message: string, ...meta: unknown[]) {
    super.log(this.formatMeta(message, meta));
  }

  override error(message: string, ...meta: unknown[]) {
    super.error(this.formatMeta(message, meta));
  }

  override warn(message: string, ...meta: unknown[]) {
    super.warn(this.formatMeta(message, meta));
  }

  override debug(message: string, ...meta: unknown[]) {
    super.debug(this.formatMeta(message, meta));
  }

  override verbose(message: string, ...meta: unknown[]) {
    super.verbose(this.formatMeta(message, meta));
  }

  private formatMeta(message: string, meta: unknown[]): string {
    if (!meta?.length) return message;
    const sanitized = meta.map((item) => this.redact(item));
    return `${message} ${this.safeStringify(sanitized)}`;
  }

  private redact(value: unknown): unknown {
    const seen = new WeakSet<object>();

    const walk = (val: unknown, depth: number): unknown => {
      // 1. primitive — nothing to track, return as-is
      if (typeof val !== 'object' || val === null) return val;

      // 2. circular check — always before seen.add() and before depth
      if (seen.has(val)) return { __circular: true };

      // 3. register — before recursing into children
      seen.add(val);

      // 4. depth check — after circular, before any recursive work
      if (depth >= MAX_REDACT_DEPTH) return { __truncated: true };

      // 5a. arrays — recurse each element with shared seen + incremented depth
      if (Array.isArray(val)) {
        return val.map((item) => walk(item, depth + 1));
      }

      // 5b. objects
      const obj = val as Record<string, unknown>;
      return Object.fromEntries(
        Object.entries(obj).map(([key, item]) => {
          const keyLower = key.toLowerCase();

          if (SENSITIVE_KEYS.has(keyLower)) {
            return [key, '[REDACTED]'];
          }

          return [key, walk(item, depth + 1)];
        }),
      );
    };

    return walk(value, 0);
  }

  private safeStringify(value: unknown): string {
    try {
      return JSON.stringify(value, this.jsonReplacer);
    } catch {
      return '[unserializable]';
    }
  }

  private jsonReplacer(_key: string, value: unknown): unknown {
    if (typeof value === 'bigint') return value.toString();
    return value;
  }
}
