// DeepSeek Harness GPT desktop app. It verifies official Codex ChatGPT sign-in,
// starts the stock Harness web profile with a local Codex LLM overlay, then
// owns both child lifecycles behind one native window.

const { app, BrowserWindow, shell, dialog } = require('electron');
const { spawn, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { createRequire } = require('module');
const { pathToFileURL } = require('url');

const DEFAULT_APP_DIR = path.join(__dirname, 'runtime', 'dsh');
const DEFAULT_HOME = 'E:\\DeepSeekHarness\\data';
const DEFAULT_WORKSPACE = 'E:\\DeepSeekHarness\\workspace';

function defaultDshAppDir() {
  if (process.env.DSH_APP_DIR) return process.env.DSH_APP_DIR;
  if (app.isPackaged) return path.join(process.resourcesPath, 'dsh');
  return DEFAULT_APP_DIR;
}

function defaultDshHome() {
  if (process.env.DSH_HOME) return process.env.DSH_HOME;
  if (fs.existsSync(DEFAULT_HOME)) return DEFAULT_HOME;
  return path.join(app.getPath('userData'), 'data');
}

function defaultDshWorkspace() {
  if (process.env.DSH_WORKSPACE) return process.env.DSH_WORKSPACE;
  if (fs.existsSync(DEFAULT_WORKSPACE)) return DEFAULT_WORKSPACE;
  return app.getPath('documents');
}

const DSH_APP_DIR = defaultDshAppDir();
const DSH_HOME = defaultDshHome();
const DSH_WORKSPACE = defaultDshWorkspace();
const DSH_ENTRY = path.join(DSH_APP_DIR, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js');
const CODEX_PLUGIN = path.join(
  DSH_APP_DIR,
  'node_modules',
  '@local',
  'dsh-llm-codex-chatgpt',
  'index.js'
);
const CODEX_PATCH_TEMPLATE = app.isPackaged
  ? path.join(process.resourcesPath, 'codex.patch.yml')
  : path.join(__dirname, 'codex.patch.yml');
const START_TIMEOUT_MS = 45 * 1000;
const CODEX_LOGIN_TIMEOUT_MS = 10 * 60 * 1000;

let mainWindow = null;
let loginWindow = null;
let serverProcess = null;
let loginProcess = null;
let serverUrl = '';
let quitting = false;
let runtimeCodexPatch = '';

function checkPath(p, label) {
  if (!fs.existsSync(p)) {
    dialog.showErrorBox(
      'DeepSeek Harness',
      `找不到 ${label}：\n${p}\n\n源码运行请先执行 npm run prepare:runtime。`
    );
    app.exit(1);
    return false;
  }
  return true;
}

function parseServerUrl(text) {
  const m = String(text).match(/dsh web:\s*(https?:\/\/[^\s]+)/);
  return m ? m[1] : '';
}

function prepareCodexPatch() {
  const template = fs.readFileSync(CODEX_PATCH_TEMPLATE, 'utf8');
  const marker = '__DSH_CODEX_PLUGIN_URL__';
  if (!template.includes(marker)) {
    throw new Error('ChatGPT 模型补丁缺少插件路径占位符。');
  }
  const rendered = template.replace(marker, JSON.stringify(pathToFileURL(CODEX_PLUGIN).href));
  const target = path.join(DSH_HOME, 'codex-desktop.patch.yml');
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, rendered, { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temporary, target);
  runtimeCodexPatch = target;
}

function resolveCodexCli() {
  const anchors = [
    path.join(DSH_APP_DIR, 'package.json'),
    path.join(
      DSH_APP_DIR,
      'node_modules',
      '@local',
      'dsh-llm-codex-chatgpt',
      'package.json'
    ),
  ];
  for (const anchor of anchors) {
    try {
      const packageJson = createRequire(anchor).resolve('@openai/codex/package.json');
      const cli = path.join(path.dirname(packageJson), 'bin', 'codex.js');
      if (fs.existsSync(cli)) return cli;
    } catch (_) {
      // Try the next package-resolution anchor.
    }
  }
  throw new Error('找不到桌面版内置的 OpenAI Codex CLI。');
}

function killProcessTree(child) {
  if (!child || child.killed) return;
  const pid = child.pid;
  if (process.platform === 'win32' && pid) {
    execFile('taskkill', ['/pid', String(pid), '/T', '/F'], () => {});
    return;
  }
  try {
    child.kill('SIGTERM');
  } catch (_) {
    // The process already exited.
  }
}

function runCodex(args, timeoutMs) {
  return new Promise((resolve, reject) => {
    let cli;
    try {
      cli = resolveCodexCli();
    } catch (error) {
      reject(error);
      return;
    }
    const child = spawn(process.execPath, [cli, ...args], {
      cwd: DSH_WORKSPACE,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      windowsHide: true,
    });
    if (args[0] === 'login' && args.length === 1) loginProcess = child;
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      killProcessTree(child);
      reject(new Error(`Codex ${args.join(' ')} 超时。`));
    }, timeoutMs);
    child.stdout.on('data', data => { stdout += data.toString(); });
    child.stderr.on('data', data => { stderr += data.toString(); });
    child.on('error', error => {
      clearTimeout(timer);
      if (loginProcess === child) loginProcess = null;
      reject(error);
    });
    child.on('exit', code => {
      clearTimeout(timer);
      if (loginProcess === child) loginProcess = null;
      resolve({ code, stdout, stderr });
    });
  });
}

async function hasChatGptLogin() {
  const status = await runCodex(['login', 'status'], 20 * 1000);
  return status.code === 0 && /ChatGPT/i.test(`${status.stdout}\n${status.stderr}`);
}

function showLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 560,
    height: 360,
    resizable: false,
    maximizable: false,
    minimizable: false,
    closable: false,
    title: '登录 ChatGPT',
    autoHideMenuBar: true,
    backgroundColor: '#f5f1e8',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#f5f1e8;color:#14211c;font:16px/1.6 system-ui,"Microsoft YaHei",sans-serif}
    main{padding:52px 48px}h1{margin:0 0 18px;font-size:27px}p{margin:8px 0;color:#53615b}
    .dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:#16a06a;margin-right:10px;animation:p 1.2s infinite}
    @keyframes p{50%{opacity:.25;transform:scale(.7)}}small{display:block;margin-top:34px;color:#78837e}
  </style><main><h1><span class="dot"></span>使用 ChatGPT 登录</h1>
  <p>已在默认浏览器中打开 OpenAI 官方登录页。</p>
  <p>完成登录后，这个窗口会自动关闭并启动 DeepSeek Harness GPT。</p>
  <small>桌面应用不会读取或保存你的 OAuth Token，认证状态由 OpenAI Codex 管理。</small></main>`;
  loginWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

async function ensureChatGptLogin() {
  if (await hasChatGptLogin()) return;
  showLoginWindow();
  const login = await runCodex(['login'], CODEX_LOGIN_TIMEOUT_MS);
  if (login.code !== 0 || !(await hasChatGptLogin())) {
    throw new Error(
      `ChatGPT 登录没有完成（退出码 ${login.code}）。\n${login.stderr || login.stdout}`
    );
  }
  if (loginWindow && !loginWindow.isDestroyed()) loginWindow.close();
  loginWindow = null;
}

function waitForHttp(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      const req = http.get(url, (res) => {
        if (res.statusCode) {
          clearInterval(timer);
          res.resume();
          resolve(true);
        }
      });
      req.on('error', () => {
        // keep waiting until timeout
      });
      req.setTimeout(3000, () => req.destroy());
      if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        req.destroy();
        reject(new Error(`等待 DeepSeek Harness 启动超时（${Math.round(timeoutMs / 1000)} 秒）`));
      }
    }, 500);
  });
}

function startDshServer() {
  return new Promise((resolve, reject) => {
    if (!checkPath(DSH_ENTRY, 'dsh bin.js')) return;
    if (!checkPath(DSH_HOME, 'DSH_HOME 数据目录')) return;
    if (!checkPath(CODEX_PATCH_TEMPLATE, 'ChatGPT 模型补丁')) return;
    if (!checkPath(CODEX_PLUGIN, 'ChatGPT 模型适配器')) return;
    prepareCodexPatch();

    const env = {
      ...process.env,
      DSH_HOME,
      DSH_TELEMETRY_DISABLED: '1',
      DSH_TELEMETRY_MODE: 'DISABLED',
      // Run the dsh Node CLI with Electron's bundled Node runtime so the
      // packaged EXE does not require a separate system Node installation.
      ELECTRON_RUN_AS_NODE: '1',
    };

    // Let the OS pick a free port; dsh prints "dsh web: http://127.0.0.1:<port>".
    // --expose-internals is required by the dsh HMR service.
    const child = spawn(
      process.execPath,
      [
        '--expose-internals',
        DSH_ENTRY,
        '--profile',
        'web',
        '--patch',
        runtimeCodexPatch,
        '--port',
        '0',
      ],
      {
        cwd: DSH_WORKSPACE,
        env,
        windowsHide: true,
      }
    );
    serverProcess = child;

    let output = '';
    const onData = (buf) => {
      output += buf.toString();
      const url = parseServerUrl(output);
      if (url && !serverUrl) {
        serverUrl = url;
        resolve(serverUrl);
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('error', (err) => {
      reject(new Error(`无法启动 dsh：${err.message}`));
    });
    child.on('exit', (code, signal) => {
      if (!serverUrl) {
        reject(new Error(`dsh 提前退出（code=${code} signal=${signal}）：\n${output}`));
      }
    });

    // Fallback in case the URL line is not printed but the server is up.
    setTimeout(async () => {
      if (serverUrl) return;
      // Try a few common ports? With --port 0 the line should appear; this is just a safety net.
      for (const port of [3080, 3180, 4173, 5173, 8080]) {
        const url = `http://127.0.0.1:${port}`;
        try {
          await waitForHttp(url, 1500);
          serverUrl = url;
          resolve(serverUrl);
          return;
        } catch (_) {
          // continue
        }
      }
      reject(new Error(`无法从 dsh 输出中解析启动地址。输出：\n${output}`));
    }, START_TIMEOUT_MS);
  });
}

function killServer() {
  if (!serverProcess || serverProcess.killed) return;
  killProcessTree(serverProcess);
  serverProcess = null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'DeepSeek Harness GPT',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Keep navigation inside the local DeepSeek Harness server unless it's a
    // deep link to the same host.
    const allowed = url.startsWith(serverUrl);
    if (!allowed) {
      event.preventDefault();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        shell.openExternal(url);
      }
    }
  });

  mainWindow.webContents.on('page-title-updated', (event) => {
    event.preventDefault();
    mainWindow.setTitle('DeepSeek Harness GPT');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadURL(serverUrl);
}

app.setAppUserModelId('DeepSeekHarnessGPT');

app.whenReady().then(async () => {
  try {
    await ensureChatGptLogin();
    await startDshServer();
  } catch (err) {
    if (loginWindow && !loginWindow.isDestroyed()) loginWindow.destroy();
    loginWindow = null;
    dialog.showErrorBox(
      'DeepSeek Harness GPT 启动失败',
      String(err && err.message ? err.message : err)
    );
    app.exit(1);
    return;
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', () => {
  quitting = true;
  killProcessTree(loginProcess);
  loginProcess = null;
  killServer();
});

process.on('exit', () => {
  if (!quitting) killServer();
});
