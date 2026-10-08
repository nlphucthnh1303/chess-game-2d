// ============================================================
// electron/preload.js — Context Bridge (Secure IPC)
// ============================================================
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Game actions from native menu
  onMenuAction: (callback) => ipcRenderer.on('menu-action', (event, action) => callback(action)),
  
  // File operations
  saveGame: (gameData) => ipcRenderer.invoke('save-game-dialog', gameData),
  loadGame: () => ipcRenderer.invoke('load-game-dialog'),
  
  // Window operations
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  
  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // Is running in Electron
  isElectron: true,
  
  // Platform
  platform: process.platform
});
