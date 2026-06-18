#!/usr/bin/env node

import { createWriteStream } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { spawn } from 'node:child_process';

const PORT = Number(process.env.RN_METRO_PORT ?? 8081);
const METRO_STATUS_URL = `http://127.0.0.1:${PORT}/status`;
const METRO_READY_TEXT = 'packager-status:running';
const METRO_TIMEOUT_MS = 60_000;
const METRO_POLL_MS = 1_000;
const ROOT_DIR = process.cwd();

const [, , platform, ...forwardArgs] = process.argv;

if (platform !== 'ios' && platform !== 'android') {
  console.error('Usage: node ./scripts/dev-run.mjs <ios|android> [...args]');
  process.exit(1);
}

const metroState = await getMetroState();

if (metroState === 'occupied') {
  console.error(
    `Port ${PORT} is in use, but Metro did not respond at ${METRO_STATUS_URL}. ` +
      'Free the port or run `pnpm start --reset-cache` after stopping the conflicting process.'
  );
  process.exit(1);
}

let metroLogPath = null;

if (metroState !== 'running') {
  metroLogPath = await startMetroInBackground();
  await waitForMetro(metroLogPath);
}

await runPlatformCommand(platform, forwardArgs);

async function runPlatformCommand(targetPlatform, args) {
  const commandArgs = [targetPlatform === 'ios' ? 'ios' : 'android', ...args];
  const child = spawn('pnpm', commandArgs, {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  child.on('error', error => {
    console.error(`Failed to launch pnpm ${commandArgs.join(' ')}: ${error.message}`);
  });

  const exitCode = await new Promise(resolve => {
    child.on('exit', code => resolve(code ?? 1));
  });

  process.exit(exitCode);
}

async function waitForMetro(logPath) {
  const deadline = Date.now() + METRO_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if ((await getMetroState()) === 'running') {
      console.log(`Metro is running on port ${PORT}.`);
      return;
    }

    await delay(METRO_POLL_MS);
  }

  console.error(
    `Metro did not become ready within ${METRO_TIMEOUT_MS / 1000}s. ` +
      `Check the log at ${logPath}.`
  );
  process.exit(1);
}

async function startMetroInBackground() {
  const timestamp = new Date().toISOString().replaceAll(':', '-');
  const logPath = path.join(os.tmpdir(), `hrms-metro-${timestamp}.log`);
  const logStream = createWriteStream(logPath, { flags: 'a' });

  logStream.write(`[${new Date().toISOString()}] Starting Metro on port ${PORT}\n`);

  const startArgs = PORT === 8081 ? ['start'] : ['start', '--', '--port', String(PORT)];
  const child = spawn('pnpm', startArgs, {
    cwd: ROOT_DIR,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    env: process.env,
  });

  child.stdout.pipe(logStream);
  child.stderr.pipe(logStream);
  child.unref();

  child.on('error', error => {
    logStream.write(`[${new Date().toISOString()}] Failed to start Metro: ${error.message}\n`);
  });

  child.on('exit', code => {
    logStream.write(`[${new Date().toISOString()}] Metro exited with code ${code ?? 1}\n`);
  });

  console.log(`Starting Metro in the background. Log: ${logPath}`);

  return logPath;
}

async function getMetroState() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1_500);

  try {
    const response = await fetch(METRO_STATUS_URL, { signal: controller.signal });
    const body = (await response.text()).trim();
    return response.ok && body === METRO_READY_TEXT ? 'running' : 'occupied';
  } catch {
    return (await isPortOpen(PORT)) ? 'occupied' : 'stopped';
  } finally {
    clearTimeout(timeout);
  }
}

function isPortOpen(port) {
  return new Promise(resolve => {
    const socket = net.createConnection({ host: '127.0.0.1', port });

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.once('error', () => {
      resolve(false);
    });

    socket.setTimeout(1_000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}
