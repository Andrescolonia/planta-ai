import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';

const nativeConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

let initialized = false;

function formatPart(part) {
  if (part instanceof Error) {
    return `${part.stack || part.message}`;
  }

  if (typeof part === 'string') {
    return part;
  }

  try {
    return JSON.stringify(part);
  } catch {
    return String(part);
  }
}

function appendLine(filePath, level, parts) {
  const message = parts.map(formatPart).join(' ');
  const line = `[${new Date().toISOString()}] [${level}] ${message}\n`;

  try {
    fs.appendFileSync(filePath, line, 'utf8');
  } catch (error) {
    nativeConsole.warn(`[logger] No fue posible escribir en ${filePath}: ${error.message}`);
  }
}

export function initializeLogger() {
  if (initialized) {
    return;
  }

  initialized = true;
  fs.mkdirSync(env.logDir, { recursive: true });

  const serverLogPath = path.join(env.logDir, 'server.log');
  const errorLogPath = path.join(env.logDir, 'error.log');

  console.log = (...parts) => {
    appendLine(serverLogPath, 'INFO', parts);
    nativeConsole.log(...parts);
  };

  console.info = (...parts) => {
    appendLine(serverLogPath, 'INFO', parts);
    nativeConsole.info(...parts);
  };

  console.warn = (...parts) => {
    appendLine(serverLogPath, 'WARN', parts);
    appendLine(errorLogPath, 'WARN', parts);
    nativeConsole.warn(...parts);
  };

  console.error = (...parts) => {
    appendLine(serverLogPath, 'ERROR', parts);
    appendLine(errorLogPath, 'ERROR', parts);
    nativeConsole.error(...parts);
  };

  process.on('unhandledRejection', (reason) => {
    console.error('Promesa rechazada sin manejar.', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Excepcion no controlada.', error);
    process.exit(1);
  });
}
