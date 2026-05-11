/**
 * Auto-start the Python ML microservice (Flask on ML_PORT / ML_SERVICE_URL)
 * when the Node backend starts, if it is not already healthy.
 *
 * Disable with AUTO_START_ML_SERVICE=false
 * Override Python: ML_PYTHON (e.g. py, python3, or full path)
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

let spawnedChild = null;
let shutdownHooksRegistered = false;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseMlConnection() {
  const raw = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';
  try {
    const u = new URL(raw);
    return {
      host: u.hostname,
      port: Number(u.port || 5001),
    };
  } catch {
    return { host: '127.0.0.1', port: 5001 };
  }
}

function checkHealth(host, port) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: host,
        port,
        path: '/api/ml/health',
        method: 'GET',
        timeout: 2500,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => {
          data += c;
        });
        res.on('end', () => {
          try {
            const j = JSON.parse(data);
            resolve(j.status === 'ok' && j.modelsLoaded === true);
          } catch {
            resolve(false);
          }
        });
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

function registerShutdownHooks() {
  if (shutdownHooksRegistered) return;
  shutdownHooksRegistered = true;

  const killChild = () => {
    const ch = spawnedChild;
    if (!ch || ch.killed) return;
    try {
      ch.kill();
    } catch {
      // ignore
    }
  };

  process.once('exit', killChild);
  process.once('SIGINT', () => {
    killChild();
    process.exit(0);
  });
  process.once('SIGTERM', () => {
    killChild();
    process.exit(0);
  });
}

async function waitForHealthy(host, port, attempts = 50, intervalMs = 400) {
  for (let i = 0; i < attempts; i += 1) {
    if (await checkHealth(host, port)) return true;
    await sleep(intervalMs);
  }
  return false;
}

async function ensurePythonMlService() {
  const off = ['0', 'false', 'no', 'off'].includes(
    String(process.env.AUTO_START_ML_SERVICE || '').toLowerCase()
  );
  if (off) {
    console.log('[ml-service] AUTO_START_ML_SERVICE is off — not spawning Python');
    return;
  }

  const { host, port } = parseMlConnection();
  if (host !== '127.0.0.1' && host !== 'localhost') {
    console.log(
      `[ml-service] ML_SERVICE_URL host is ${host} — auto-start only runs for localhost; start Python ML on that host yourself.`
    );
    return;
  }

  if (await checkHealth(host, port)) {
    console.log(`[ml-service] Already running on ${host}:${port}`);
    return;
  }

  const mlDir = path.join(__dirname, '..', 'ml_service');
  const appPy = path.join(mlDir, 'app.py');
  if (!fs.existsSync(appPy)) {
    console.warn('[ml-service] ml_service/app.py missing — cannot auto-start');
    return;
  }

  const pythonExe = process.env.ML_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
  const isPyLauncher = /^py(\.exe)?$/i.test(path.basename(pythonExe));
  const spawnArgs = isPyLauncher ? ['-3', appPy] : [appPy];
  const env = { ...process.env, ML_PORT: String(port), PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' };

  console.log(`[ml-service] Starting ${pythonExe} → port ${port} (cwd: ${mlDir})`);

  spawnedChild = spawn(pythonExe, spawnArgs, {
    cwd: mlDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  spawnedChild.stdout.on('data', (buf) => {
    process.stdout.write(`[ml-service] ${buf.toString()}`);
  });
  spawnedChild.stderr.on('data', (buf) => {
    process.stderr.write(`[ml-service] ${buf.toString()}`);
  });
  spawnedChild.on('error', (err) => {
    console.error('[ml-service] Spawn error:', err.message);
    console.error(
      '[ml-service] Tip: install Python 3.9+ with Flask/scikit-learn, or set ML_PYTHON to your interpreter (Windows: often `py` with launcher).'
    );
  });
  spawnedChild.on('exit', (code) => {
    if (code != null && code !== 0) {
      console.warn(`[ml-service] Python process exited with code ${code}`);
    }
    spawnedChild = null;
  });

  registerShutdownHooks();

  const ok = await waitForHealthy(host, port);
  if (ok) {
    console.log(`[ml-service] Healthy on http://${host}:${port}`);
  } else {
    console.warn(
      '[ml-service] Timed out waiting for /api/ml/health — backend will use JS fallback if available. Check Python deps: pip install -r ml_service/requirements.txt'
    );
  }
}

module.exports = { ensurePythonMlService };
