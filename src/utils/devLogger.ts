// devLogger.ts
// Small development-only utility to capture browser console messages
// Exposes a global `window.__DEV_LOGGER__` with methods: getLogs(), exportLogs(), clearLogs()
// Only initialized when NODE_ENV !== 'production'.

type DevLogEntry = {
  ts: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  args: any[];
  stack?: string;
};

const MAX_LOGS = 2000;

class DevLogger {
  private logs: DevLogEntry[] = [];
  private original: Partial<Record<string, any>> = {};
  private enabled = false;

  start() {
    if (this.enabled) return;
    this.enabled = true;
    const levels: Array<DevLogEntry['level']> = ['log', 'info', 'warn', 'error', 'debug'];
    levels.forEach((lvl) => {
      const orig = (console as any)[lvl] ?? ((console as any).log.bind(console));
      this.original[lvl] = orig;
      (console as any)[lvl] = (...args: any[]) => {
        try {
          const entry: DevLogEntry = { ts: new Date().toISOString(), level: lvl, args };
          // capture simple stack for errors
          if (lvl === 'error') {
            try { throw new Error(); } catch (e: any) { entry.stack = e.stack; }
          }
          this.logs.push(entry);
          if (this.logs.length > MAX_LOGS) this.logs.shift();
        } catch (e) {
          // swallow
        }
        try { orig.apply(console, args); } catch (e) { /* ignore */ }
      };
    });
  }

  stop() {
    if (!this.enabled) return;
    this.enabled = false;
    Object.keys(this.original).forEach((k) => {
      try { (console as any)[k] = this.original[k]; } catch (e) { /* ignore */ }
    });
    this.original = {};
  }

  getLogs() { return this.logs.slice(); }

  clear() { this.logs = []; }

  export(filename = `dev-logs-${new Date().toISOString()}.json`) {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}

const logger = new DevLogger();

export function initDevLoggerIfNeeded() {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) return; // do nothing in production
    logger.start();
    // Expose a global accessor
    (window as any).__DEV_LOGGER__ = {
      getLogs: () => logger.getLogs(),
      exportLogs: (filename?: string) => logger.export(filename),
      clearLogs: () => logger.clear(),
      stop: () => logger.stop(),
    };
  } catch (e) {
    // ignore any failure
  }
}

const devLogger = {
  init: initDevLoggerIfNeeded,
};

export default devLogger;













