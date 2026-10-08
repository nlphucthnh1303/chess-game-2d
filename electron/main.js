// ============================================================
// electron/main.js — Electron Main Process
// ============================================================
const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.argv.includes('--dev');
const isMac = process.platform === 'darwin';

let mainWindow;

// ============================================================
// Window Creation
// ============================================================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Chibi Chess',
    backgroundColor: '#0d0a1a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    show: false, // show after ready-to-show for smooth startup
    // Frame & titlebar
    frame: true,
    autoHideMenuBar: false,
  });

  // Load the game
  const gameUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../web/index.html')}`;

  mainWindow.loadURL(gameUrl);

  // Show window once content is loaded (no white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Build application menu
  buildMenu();
}

// ============================================================
// Application Menu
// ============================================================
function buildMenu() {
  const template = [
    // App menu (macOS)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),

    // Game menu
    {
      label: '🎮 Game',
      submenu: [
        {
          label: '🔄 Ván Mới',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu-action', 'new-game')
        },
        {
          label: '↩ Hoàn Tác',
          accelerator: 'CmdOrCtrl+Z',
          click: () => mainWindow?.webContents.send('menu-action', 'undo')
        },
        { type: 'separator' },
        {
          label: '💾 Lưu Game',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu-action', 'save-game')
        },
        {
          label: '📂 Tải Game',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu-action', 'load-game')
        },
        { type: 'separator' },
        {
          label: '🏠 Menu Chính',
          accelerator: 'Escape',
          click: () => mainWindow?.webContents.send('menu-action', 'go-menu')
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit', label: '❌ Thoát' }
      ]
    },

    // View menu
    {
      label: '👁 Xem',
      submenu: [
        {
          label: '⛶ Toàn Màn Hình',
          accelerator: 'F11',
          click: () => {
            if (mainWindow) {
              mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
          }
        },
        {
          label: '🔍 Phóng To',
          accelerator: 'CmdOrCtrl+=',
          click: () => mainWindow?.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5)
        },
        {
          label: '🔍 Thu Nhỏ',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow?.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5)
        },
        {
          label: 'Đặt Lại Thu Phóng',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow?.webContents.setZoomLevel(0)
        },
        { type: 'separator' },
        ...(isDev ? [{ role: 'toggleDevTools' }] : [])
      ]
    },

    // Help menu
    {
      label: '❓ Trợ Giúp',
      submenu: [
        {
          label: '📖 Hướng Dẫn Chơi',
          click: () => mainWindow?.webContents.send('menu-action', 'show-help')
        },
        {
          label: '🏆 Thành Tích',
          click: () => mainWindow?.webContents.send('menu-action', 'show-achievements')
        },
        { type: 'separator' },
        {
          label: '🌐 Trang Web Chính Thức',
          click: () => shell.openExternal('https://chibichess.game')
        },
        {
          label: 'ℹ️ Về Chibi Chess',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Về Chibi Chess',
              message: 'Chibi Chess v1.0.0',
              detail: 'Cờ Vua Chibi 2D — Game cờ vua với nhân vật chibi dễ thương\n\nPhaser.js + Electron\n© 2025 Chibi Chess Studio',
              buttons: ['OK'],
              icon: null
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ============================================================
// IPC Handlers
// ============================================================

// Save game dialog
ipcMain.handle('save-game-dialog', async (event, gameData) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Lưu Ván Cờ',
    defaultPath: `chibi_chess_${Date.now()}.json`,
    filters: [
      { name: 'Chibi Chess Save', extensions: ['json'] }
    ]
  });

  if (!result.canceled && result.filePath) {
    try {
      fs.writeFileSync(result.filePath, gameData, 'utf8');
      return { success: true, path: result.filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { success: false, canceled: true };
});

// Load game dialog
ipcMain.handle('load-game-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Tải Ván Cờ',
    filters: [
      { name: 'Chibi Chess Save', extensions: ['json'] }
    ],
    properties: ['openFile']
  });

  if (!result.canceled && result.filePaths[0]) {
    try {
      const data = fs.readFileSync(result.filePaths[0], 'utf8');
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { success: false, canceled: true };
});

// Fullscreen toggle
ipcMain.handle('toggle-fullscreen', () => {
  if (mainWindow) {
    const fs = !mainWindow.isFullScreen();
    mainWindow.setFullScreen(fs);
    return fs;
  }
  return false;
});

// Get app version
ipcMain.handle('get-version', () => app.getVersion());

// ============================================================
// App Lifecycle
// ============================================================
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Security: prevent new window creation from renderer
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
