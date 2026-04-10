/**
 * Tiny leveled logger.
 *
 * Gives us a single switch point for future remote logging (Sentry,
 * LogRocket, …) instead of `console.*` calls scattered across 40
 * files. Levels follow the usual syslog-ish ordering.
 *
 *   import { logger } from './core/logger.js';
 *   logger.info('boot', 'App started');
 *   logger.error('router', 'navigate failed', err);
 *
 * Set the active level via:
 *   localStorage.setItem('diskalkuli:log', 'debug');
 */

const LEVELS = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };

function readLevel() {
  try {
    const fromStorage = localStorage.getItem('diskalkuli:log');
    if (fromStorage && LEVELS[fromStorage] != null) return LEVELS[fromStorage];
  } catch { /* private mode, ignore */ }
  // Default: info in dev (localhost / file://), warn in production.
  const host = (typeof location !== 'undefined' && location.hostname) || '';
  const isDev = host === 'localhost' || host === '127.0.0.1' || host === '' || host.endsWith('.local');
  return isDev ? LEVELS.info : LEVELS.warn;
}

let activeLevel = readLevel();

function fmt(scope, args) {
  return [`[${scope}]`, ...args];
}

export const logger = {
  /** Set the minimum active level ('silent' | 'error' | 'warn' | 'info' | 'debug'). */
  setLevel(name) {
    if (LEVELS[name] != null) activeLevel = LEVELS[name];
  },

  debug(scope, ...args) {
    if (activeLevel >= LEVELS.debug) console.debug(...fmt(scope, args));
  },

  info(scope, ...args) {
    if (activeLevel >= LEVELS.info) console.info(...fmt(scope, args));
  },

  warn(scope, ...args) {
    if (activeLevel >= LEVELS.warn) console.warn(...fmt(scope, args));
  },

  error(scope, ...args) {
    if (activeLevel >= LEVELS.error) console.error(...fmt(scope, args));
    // Future: forward to remote error reporting here.
  },
};
