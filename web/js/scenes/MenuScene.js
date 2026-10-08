// ============================================================
// MenuScene.js — Full-featured main menu
// Includes: Mode select, AI difficulty, Timer, Settings, Stats
// ============================================================
import { soundManager } from '../utils/SoundManager.js';
import { settingsManager, statsManager, achievementsManager, BOARD_THEMES, TIMER_MODES, AIDifficulty } from '../utils/GamePersistence.js';
import { SaveManager } from '../utils/GamePersistence.js';
import { Color } from '../chess/ChessLogic.js';

const MENU_STATES = {
  MAIN: 'main',
  PLAY: 'play',
  SETTINGS: 'settings',
  STATS: 'stats',
  CREDITS: 'credits'
};

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const { width, height } = this.scale;
    this.cx = width / 2;
    this.cy = height / 2;
    this.currentMenu = MENU_STATES.MAIN;
    this._menuObjects = [];

    soundManager.resume();
    if (!soundManager._musicPlaying) soundManager.startAmbientMusic();

    this.createBackground(width, height);
    this.createTitle(this.cx, this.cy);
    this.showMainMenu();
    this.createFloatingPieces(width, height);

    // Camera fade in
    this.cameras.main.setAlpha(0);
    this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 500 });

    // Electron menu actions
    if (window.electronAPI) {
      window.electronAPI.onMenuAction((action) => {
        if (action === 'show-help') this.showHelp();
        if (action === 'show-achievements') this.showAchievementsScreen();
      });
    }
  }

  // ============================================================
  // BACKGROUND
  // ============================================================
  createBackground(width, height) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0a1a, 0x0d0a1a, 0x1a0a3e, 0x1a0a3e, 1);
    bg.fillRect(0, 0, width, height);

    // Glowing orb
    const orb = this.add.graphics();
    orb.fillStyle(0x7c6af7, 0.07);
    orb.fillCircle(this.cx, this.cy - 60, 300);
    this.tweens.add({ targets: orb, scaleX: 1.2, scaleY: 1.2, duration: 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Stars
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const r = Phaser.Math.FloatBetween(0.5, 2.5);
      const a = Phaser.Math.FloatBetween(0.2, 0.9);
      const star = this.add.circle(x, y, r, 0xffffff, a);
      this.tweens.add({
        targets: star, alpha: { from: a, to: a * 0.2 },
        duration: Phaser.Math.Between(1200, 4000),
        yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2000)
      });
    }

    // Decorative chessboard bottom corner
    const boardPreview = this.add.graphics();
    const ts = 36;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        boardPreview.fillStyle((r + c) % 2 === 0 ? 0xf0d9b5 : 0xb58863, 0.05);
        boardPreview.fillRect(width - 5 * ts - 20 + c * ts, height - 5 * ts - 20 + r * ts, ts, ts);
      }
    }
    // Left corner
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        boardPreview.fillStyle((r + c) % 2 === 0 ? 0xf0d9b5 : 0xb58863, 0.05);
        boardPreview.fillRect(20 + c * ts, height - 5 * ts - 20 + r * ts, ts, ts);
      }
    }
  }

  createTitle(cx, cy) {
    // Crown
    const crown = this.add.text(cx, cy - 215, '👑', { fontSize: '46px' }).setOrigin(0.5);
    this.tweens.add({ targets: crown, y: cy - 225, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Main title
    const title = this.add.text(cx, cy - 158, 'CHIBI CHESS', {
      fontFamily: "'Cinzel', serif",
      fontSize: '58px', fontStyle: 'bold',
      color: '#f0d9b5',
      stroke: '#c9a227', strokeThickness: 3,
      shadow: { color: '#7c6af7', blur: 30, fill: true, offsetX: 0, offsetY: 0 }
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, alpha: { from: 1, to: 0.88 }, duration: 2500, yoyo: true, repeat: -1 });

    // Subtitle
    this.add.text(cx, cy - 96, '⚔  Cờ Vua Chibi Kỳ Ảo  ⚔', {
      fontFamily: "'Inter', sans-serif", fontSize: '17px',
      color: 'rgba(200,190,255,0.8)', letterSpacing: 3
    }).setOrigin(0.5);

    // Decorative line
    const div = this.add.graphics();
    div.fillStyle(0xc9a227, 0.5);
    div.fillRect(cx - 130, cy - 72, 260, 1);

    // Version
    this.add.text(cx + 200, cy + 320, 'v1.0.0', {
      fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(180,170,220,0.4)'
    }).setOrigin(0.5);
  }

  // ============================================================
  // MENU SYSTEMS
  // ============================================================
  _clearMenuObjects() {
    this._menuObjects.forEach(o => { try { o.destroy(); } catch {} });
    this._menuObjects = [];
  }

  _addMenuObj(obj) { this._menuObjects.push(obj); return obj; }

  showMainMenu() {
    this._clearMenuObjects();
    this.currentMenu = MENU_STATES.MAIN;
    const { cx, cy } = this;
    const startY = cy - 30;
    const hasSave = SaveManager.hasSavedGame();

    const buttons = [
      { label: '⚔  Chơi',        key: 'play',     color: 0x7c6af7, glow: 0x9080ff },
      ...(hasSave ? [
        { label: '📂  Tiếp Tục',  key: 'continue', color: 0x4a7a3a, glow: 0x5a9a4a }
      ] : []),
      { label: '⚙️  Cài Đặt',    key: 'settings', color: 0x2a1a4a, glow: 0x4a3a8a },
      { label: '📊  Thống Kê',   key: 'stats',    color: 0x1a2a3a, glow: 0x2a4a6a },
      { label: '❓  Trợ Giúp',   key: 'help',     color: 0x2a1a2a, glow: 0x4a3a5a },
    ];

    buttons.forEach(({ label, key, color, glow, disabled }, i) => {
      const btn = this._addMenuObj(
        this.createButton(cx, startY + i * 62, 310, 48, label, color, glow, disabled || false, () => {
          soundManager.playClick();
          this._handleMainButton(key);
        })
      );
    });

    // Achievement progress badge
    const prog = achievementsManager.getProgress();
    if (prog.unlocked > 0) {
      const badge = this._addMenuObj(this.add.text(cx, cy + 280, `🎖️ ${prog.unlocked}/${prog.total} thành tích`, {
        fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(200,190,255,0.6)'
      }).setOrigin(0.5));
    }

    // Stats mini
    const wins = statsManager.get('wins');
    const total = statsManager.get('totalGames');
    if (total > 0) {
      this._addMenuObj(this.add.text(cx, cy + 300, `${total} ván · ${statsManager.getWinRate()}% thắng`, {
        fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(180,170,200,0.5)'
      }).setOrigin(0.5));
    }
  }

  _handleMainButton(key) {
    if (key === 'play') this.showPlayMenu();
    else if (key === 'continue') this.continueSavedGame();
    else if (key === 'settings') this.showSettingsMenu();
    else if (key === 'stats') this.showStatsScreen();
    else if (key === 'help') this.showHelp();
    else if (key === 'credits') this.showCredits();
  }

  // ============================================================
  // PLAY MENU — Mode & Configuration
  // ============================================================
  showPlayMenu() {
    this._clearMenuObjects();
    this.currentMenu = MENU_STATES.PLAY;
    const { cx, cy } = this;

    // Back button
    this._addMenuObj(this._createBackButton(() => this.showMainMenu()));

    // Title
    this._addMenuObj(this.add.text(cx, cy - 62, '🎮 Chọn Chế Độ Chơi', {
      fontFamily: "'Cinzel', serif", fontSize: '18px', fontStyle: 'bold', color: '#f0d9b5'
    }).setOrigin(0.5));

    // Mode cards
    this._createModeCard(cx - 150, cy + 10, '⚔', '2 Người (PvP)', 'Đấu với bạn bè\ntrên cùng máy', 'pvp');
    this._createModeCard(cx + 150, cy + 10, '🤖', 'Vs AI', 'Đấu với máy tính\ncác mức độ khó', 'ai');

    // Timer selector
    this._addMenuObj(this.add.text(cx, cy + 130, '⏱ Chế Độ Thời Gian:', {
      fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(200,190,255,0.8)'
    }).setOrigin(0.5));

    const timers = ['unlimited', 'bullet', 'blitz', 'blitz5', 'rapid'];
    this._timerMode = settingsManager.get('timerMode') || 'unlimited';
    this._timerBtns = {};

    timers.forEach((mode, i) => {
      const config = TIMER_MODES[mode];
      const bx = cx - (timers.length - 1) * 44 + i * 88;
      const btn = this._createToggleButton(bx, cy + 155, config.name, mode, this._timerMode, (selected) => {
        this._timerMode = selected;
        settingsManager.set('timerMode', selected);
        // Update visual state
        timers.forEach(m => {
          if (this._timerBtns[m]) {
            this._setToggleActive(this._timerBtns[m], m === selected);
          }
        });
      });
      this._timerBtns[mode] = btn;
    });

    // AI Difficulty (hidden unless AI mode)
    this._addMenuObj(this.add.text(cx, cy + 195, '🤖 Độ Khó AI:', {
      fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(200,190,255,0.8)'
    }).setOrigin(0.5));

    const diffs = ['EASY', 'MEDIUM', 'HARD'];
    this._aiDiff = settingsManager.get('aiDifficulty') || 'MEDIUM';
    this._diffBtns = {};

    diffs.forEach((d, i) => {
      const bx = cx - 140 + i * 140;
      const label = d === 'EASY' ? '😊 Dễ' : d === 'MEDIUM' ? '😐 Vừa' : '😈 Khó';
      const btn = this._createToggleButton(bx, cy + 220, label, d, this._aiDiff, (selected) => {
        this._aiDiff = selected;
        settingsManager.set('aiDifficulty', selected);
        diffs.forEach(dd => {
          if (this._diffBtns[dd]) this._setToggleActive(this._diffBtns[dd], dd === selected);
        });
      });
      this._diffBtns[d] = btn;
    });

    // Start buttons
    this.createButton(cx, cy + 282, 300, 50, '▶  BẮT ĐẦU CHƠI', 0x7c6af7, 0x9080ff, false, () => {
      soundManager.playClick();
      this._startGame('pvp');
    });
  }

  _createModeCard(x, y, icon, title, desc, mode) {
    const w = 230, h = 100;
    const bg = this.add.graphics();
    const drawCard = (hovered) => {
      bg.clear();
      bg.fillStyle(hovered ? 0x2a1a5a : 0x1a0a3a, 0.9);
      bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
      bg.lineStyle(2, hovered ? 0x7c6af7 : 0x3a2a5a, hovered ? 1 : 0.6);
      bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    };
    drawCard(false);

    const iconTxt = this.add.text(x, y - 22, icon, { fontSize: '28px' }).setOrigin(0.5);
    const titleTxt = this.add.text(x, y + 12, title, {
      fontFamily: "'Cinzel', serif", fontSize: '14px', fontStyle: 'bold', color: '#f0d9b5'
    }).setOrigin(0.5);
    const descTxt = this.add.text(x, y + 34, desc, {
      fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(200,190,255,0.7)', align: 'center'
    }).setOrigin(0.5);

    const hitzone = this.add.rectangle(x, y, w, h, 0, 0)
      .setInteractive({ useHandCursor: true });
    hitzone.on('pointerover', () => drawCard(true));
    hitzone.on('pointerout', () => drawCard(false));
    hitzone.on('pointerdown', () => {
      soundManager.playClick();
      this._startGame(mode);
    });

    [bg, iconTxt, titleTxt, descTxt, hitzone].forEach(o => this._addMenuObj(o));
  }

  _createToggleButton(x, y, label, value, currentValue, onChange) {
    const isActive = value === currentValue;
    const w = 80, h = 28;

    const bg = this.add.graphics();
    const setActive = (active) => {
      bg.clear();
      bg.fillStyle(active ? 0x7c6af7 : 0x2a1a4a, active ? 1 : 0.7);
      bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 5);
      bg.lineStyle(1, active ? 0x9080ff : 0x4a3a6a, 0.8);
      bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 5);
    };
    setActive(isActive);

    const txt = this.add.text(x, y, label, {
      fontFamily: "'Inter', sans-serif", fontSize: '11px', fontStyle: 'bold',
      color: isActive ? '#ffffff' : 'rgba(200,190,255,0.7)', align: 'center'
    }).setOrigin(0.5);

    const hitzone = this.add.rectangle(x, y, w, h, 0, 0).setInteractive({ useHandCursor: true });
    hitzone.on('pointerdown', () => {
      soundManager.playClick();
      onChange(value);
    });

    const btnObj = { bg, txt, hitzone, setActive };
    [bg, txt, hitzone].forEach(o => this._addMenuObj(o));
    return btnObj;
  }

  _setToggleActive(btn, active) {
    if (!btn) return;
    btn.setActive(active);
    btn.txt.setColor(active ? '#ffffff' : 'rgba(200,190,255,0.7)');
  }

  _startGame(mode) {
    const config = {
      mode,
      aiDifficulty: this._aiDiff || settingsManager.get('aiDifficulty') || 'MEDIUM',
      aiColor: settingsManager.get('aiColor') || 'black',
      timerMode: this._timerMode || settingsManager.get('timerMode') || 'unlimited'
    };

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', config);
    });
  }

  continueSavedGame() {
    const loaded = SaveManager.loadFromLocal();
    if (!loaded) { SaveManager.clearSave(); this.showMainMenu(); return; }
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', {
        mode: settingsManager.get('defaultMode'),
        loadedState: loaded,
        timerMode: 'unlimited'
      });
    });
  }

  // ============================================================
  // SETTINGS MENU
  // ============================================================
  showSettingsMenu() {
    this._clearMenuObjects();
    this.currentMenu = MENU_STATES.SETTINGS;
    const { cx, cy } = this;

    this._addMenuObj(this._createBackButton(() => this.showMainMenu()));
    this._addMenuObj(this.add.text(cx, cy - 160, '⚙️ Cài Đặt', {
      fontFamily: "'Cinzel', serif", fontSize: '22px', fontStyle: 'bold', color: '#f0d9b5'
    }).setOrigin(0.5));

    const sections = [
      // [label, key, type, options]
      ['🔊 Âm Thanh SFX', 'sfxEnabled', 'toggle'],
      ['🎵 Nhạc Nền', 'musicEnabled', 'toggle'],
      ['👁 Hiện Nước Hợp Lệ', 'showLegalMoves', 'toggle'],
      ['🏁 Hiện Nước Cuối', 'showLastMove', 'toggle'],
      ['🔢 Hiện Tọa Độ', 'showCoordinates', 'toggle'],
      ['🎨 Bàn Cờ', 'boardTheme', 'theme'],
      ['⚡ Tốc Độ Animation', 'animationSpeed', 'speed'],
    ];

    sections.forEach(([label, key, type, opts], i) => {
      const rowY = cy - 100 + i * 42;
      this._addMenuObj(this.add.text(cx - 150, rowY, label, {
        fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(200,190,255,0.85)'
      }).setOrigin(0, 0.5));

      if (type === 'toggle') {
        this._createSettingsToggle(cx + 80, rowY, key);
      } else if (type === 'theme') {
        this._createThemeSelector(cx + 90, rowY, key);
      } else if (type === 'speed') {
        this._createSpeedSelector(cx + 90, rowY, key);
      }
    });

    // Reset settings button
    this.createButton(cx, cy + 200, 200, 36, '🔄 Đặt Lại Mặc Định', 0x3a1a1a, 0x6a2a2a, false, () => {
      settingsManager.reset();
      soundManager.sfxEnabled = true;
      soundManager.musicEnabled = true;
      this.showSettingsMenu();
    });
  }

  _createSettingsToggle(x, y, key) {
    const current = settingsManager.get(key);
    const bg = this.add.graphics();
    let state = current;

    const draw = () => {
      bg.clear();
      bg.fillStyle(state ? 0x7c6af7 : 0x2a1a4a, 1);
      bg.fillRoundedRect(x - 25, y - 12, 50, 24, 12);
      bg.fillStyle(0xffffff, 1);
      bg.fillCircle(state ? x + 11 : x - 11, y, 9);
    };
    draw();

    const hit = this.add.rectangle(x, y, 50, 24, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      state = !state;
      settingsManager.set(key, state);
      draw();
      soundManager.playClick();
      // Apply immediately for audio settings
      if (key === 'sfxEnabled') soundManager.sfxEnabled = state;
      if (key === 'musicEnabled') soundManager.musicEnabled = state;
    });

    [bg, hit].forEach(o => this._addMenuObj(o));
  }

  _createThemeSelector(x, y, key) {
    const themes = Object.keys(BOARD_THEMES);
    const current = settingsManager.get(key) || 'classic';
    let idx = themes.indexOf(current);

    const txt = this.add.text(x, y, BOARD_THEMES[themes[idx]].name, {
      fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#c9a227'
    }).setOrigin(0.5);

    const leftBtn = this.add.text(x - 45, y, '◀', { fontSize: '14px', color: '#7c6af7' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    const rightBtn = this.add.text(x + 45, y, '▶', { fontSize: '14px', color: '#7c6af7' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    const update = (dir) => {
      idx = (idx + dir + themes.length) % themes.length;
      settingsManager.set(key, themes[idx]);
      txt.setText(BOARD_THEMES[themes[idx]].name);
      soundManager.playClick();
    };

    leftBtn.on('pointerdown', () => update(-1));
    rightBtn.on('pointerdown', () => update(1));
    [txt, leftBtn, rightBtn].forEach(o => this._addMenuObj(o));
  }

  _createSpeedSelector(x, y, key) {
    const speeds = ['slow', 'normal', 'fast'];
    const labels = { slow: '🐢 Chậm', normal: '🚶 Bình Thường', fast: '🚀 Nhanh' };
    const current = settingsManager.get(key) || 'normal';
    let idx = speeds.indexOf(current);

    const txt = this.add.text(x, y, labels[speeds[idx]], {
      fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#c9a227'
    }).setOrigin(0.5);

    const leftBtn = this.add.text(x - 55, y, '◀', { fontSize: '14px', color: '#7c6af7' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    const rightBtn = this.add.text(x + 55, y, '▶', { fontSize: '14px', color: '#7c6af7' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    const update = (dir) => {
      idx = (idx + dir + speeds.length) % speeds.length;
      settingsManager.set(key, speeds[idx]);
      txt.setText(labels[speeds[idx]]);
      soundManager.playClick();
    };

    leftBtn.on('pointerdown', () => update(-1));
    rightBtn.on('pointerdown', () => update(1));
    [txt, leftBtn, rightBtn].forEach(o => this._addMenuObj(o));
  }

  // ============================================================
  // STATS SCREEN
  // ============================================================
  showStatsScreen() {
    this._clearMenuObjects();
    this.currentMenu = MENU_STATES.STATS;
    const { cx, cy } = this;

    this._addMenuObj(this._createBackButton(() => this.showMainMenu()));
    this._addMenuObj(this.add.text(cx, cy - 160, '📊 Thống Kê', {
      fontFamily: "'Cinzel', serif", fontSize: '22px', fontStyle: 'bold', color: '#f0d9b5'
    }).setOrigin(0.5));

    const stats = statsManager.getAll();
    const rows = [
      ['🎮 Tổng ván đã chơi', stats.totalGames],
      ['🤍 Đội Trắng thắng', stats.wins.white],
      ['🖤 Đội Đen thắng', stats.wins.black],
      ['🤝 Hòa', stats.draws],
      ['♟ Tổng nước đi', stats.totalMoves],
      ['⚔ Tổng quân bị bắt', stats.captures],
      ['👑 Phong cấp', stats.promotions],
      ['🏰 Nhập thành', stats.castles],
      ['🎯 Bắt tốt qua đường', stats.enPassants],
      ['📜 Ván dài nhất', `${stats.longestGame} nước`],
      ['🔥 Chuỗi thắng tốt nhất', `${stats.streak.best} ván`],
      ['⏱ Tổng thời gian', statsManager.getFormattedPlayTime()],
      ['🏆 Tỉ lệ thắng', `${statsManager.getWinRate()}%`],
    ];

    const panelW = 400, panelH = 340;
    const panel = this.add.graphics();
    panel.fillStyle(0x120d24, 0.9);
    panel.fillRoundedRect(cx - panelW / 2, cy - panelH / 2 + 10, panelW, panelH, 10);
    panel.lineStyle(1, 0x3a2a5a, 0.8);
    panel.strokeRoundedRect(cx - panelW / 2, cy - panelH / 2 + 10, panelW, panelH, 10);
    this._addMenuObj(panel);

    rows.forEach(([label, value], i) => {
      const rowY = cy - panelH / 2 + 30 + i * 24;
      this._addMenuObj(this.add.text(cx - panelW / 2 + 16, rowY, label, {
        fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(200,190,255,0.8)'
      }));
      this._addMenuObj(this.add.text(cx + panelW / 2 - 16, rowY, String(value), {
        fontFamily: "'Cinzel', serif", fontSize: '12px', color: '#c9a227', align: 'right'
      }).setOrigin(1, 0));
    });

    // Achievements summary
    const prog = achievementsManager.getProgress();
    this._addMenuObj(this.add.text(cx, cy + panelH / 2 + 25, `🎖️ Thành tích: ${prog.unlocked}/${prog.total}`, {
      fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(200,190,255,0.7)'
    }).setOrigin(0.5));

    // Reset stats button
    this.createButton(cx, cy + panelH / 2 + 60, 200, 34, '🗑 Xóa Thống Kê', 0x3a1a1a, 0x6a2a2a, false, () => {
      soundManager.playClick();
      statsManager.reset();
      this.showStatsScreen();
    });
  }

  showAchievementsScreen() {
    this._clearMenuObjects();
    const { cx, cy } = this;

    this._addMenuObj(this._createBackButton(() => this.showMainMenu()));
    this._addMenuObj(this.add.text(cx, cy - 185, '🎖️ Thành Tích', {
      fontFamily: "'Cinzel', serif", fontSize: '22px', fontStyle: 'bold', color: '#f0d9b5'
    }).setOrigin(0.5));

    const prog = achievementsManager.getProgress();
    this._addMenuObj(this.add.text(cx, cy - 158, `Đã mở khóa: ${prog.unlocked}/${prog.total}`, {
      fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(200,190,255,0.6)'
    }).setOrigin(0.5));

    const { ACHIEVEMENTS } = await import('../utils/GamePersistence.js').catch(() => ({ ACHIEVEMENTS: [] }));
    // Fallback since we can't use dynamic import in create
    // Will show static content
    const unlocked = achievementsManager.getUnlocked();
    const locked = achievementsManager.getLocked();
    const all = [...unlocked, ...locked];

    const cols = 4, rows = 4;
    const cellW = 150, cellH = 72;
    const startX = cx - (cols * cellW) / 2 + cellW / 2;
    const startY = cy - 120;

    all.slice(0, cols * rows).forEach((a, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ax = startX + col * cellW;
      const ay = startY + row * cellH;
      const isUnlocked = achievementsManager.isUnlocked(a.id);

      const bg = this.add.graphics();
      bg.fillStyle(isUnlocked ? 0x2a1a4a : 0x1a1a2a, 0.9);
      bg.fillRoundedRect(ax - cellW / 2 + 2, ay - cellH / 2 + 2, cellW - 4, cellH - 4, 6);
      bg.lineStyle(1, isUnlocked ? 0x7c6af7 : 0x2a2a3a, 0.7);
      bg.strokeRoundedRect(ax - cellW / 2 + 2, ay - cellH / 2 + 2, cellW - 4, cellH - 4, 6);
      this._addMenuObj(bg);
      this._addMenuObj(this.add.text(ax - cellW / 2 + 12, ay - 18, a.icon, { fontSize: '20px' }).setAlpha(isUnlocked ? 1 : 0.25));
      this._addMenuObj(this.add.text(ax, ay - 10, a.name, {
        fontFamily: "'Inter', sans-serif", fontSize: '10px', fontStyle: 'bold',
        color: isUnlocked ? '#f0d9b5' : '#555', wordWrap: { width: cellW - 20 }
      }).setOrigin(0.5));
      this._addMenuObj(this.add.text(ax, ay + 12, a.desc, {
        fontFamily: "'Inter', sans-serif", fontSize: '9px',
        color: isUnlocked ? 'rgba(200,190,255,0.7)' : '#333', align: 'center', wordWrap: { width: cellW - 16 }
      }).setOrigin(0.5));
    });
  }

  // ============================================================
  // HELP
  // ============================================================
  showHelp() {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.88).setDepth(10);
    const helpText = [
      '📖  HƯỚNG DẪN CHƠI',
      '',
      '• Click quân cờ để chọn',
      '• Chấm nhỏ = ô có thể đi',
      '• Vòng tròn = ô có thể ăn quân',
      '• Click ô đích để di chuyển',
      '',
      '⌨ Phím tắt:',
      '• Ctrl+Z = Hoàn tác nước đi',
      '• Ctrl+N = Ván mới',
      '• F = Lật bàn cờ',
      '• ESC = Bỏ chọn quân',
      '',
      '⚔ Luật đặc biệt:',
      '• Nhập thành (O-O, O-O-O): Vua chưa đi',
      '• Bắt tốt qua đường: En Passant',
      '• Phong cấp: Tốt tới hàng cuối',
      '',
      '🏆 Chiếu bí đối thủ để thắng!',
      '',
      '[Click bất kỳ để đóng]'
    ].join('\n');

    const bg = this.add.graphics().setDepth(11);
    bg.fillStyle(0x150d28, 0.98);
    bg.fillRoundedRect(width / 2 - 230, height / 2 - 280, 460, 540, 14);
    bg.lineStyle(2, 0xc9a227, 0.8);
    bg.strokeRoundedRect(width / 2 - 230, height / 2 - 280, 460, 540, 14);

    const txt = this.add.text(width / 2, height / 2 - 20, helpText, {
      fontFamily: "'Inter', sans-serif", fontSize: '16px',
      color: '#f0e8d0', align: 'center', lineSpacing: 6
    }).setOrigin(0.5).setDepth(12);

    const close = () => { overlay.destroy(); bg.destroy(); txt.destroy(); };
    overlay.setInteractive().on('pointerdown', close);
  }

  // ============================================================
  // FLOATING PIECES
  // ============================================================
  createFloatingPieces(width, height) {
    const keys = ['white_queen', 'white_king', 'black_queen', 'black_king', 'white_knight', 'black_knight'];
    keys.forEach((key, i) => {
      if (!this.textures.exists(key)) return;
      const x = Phaser.Math.Between(60, width - 60);
      const y = Phaser.Math.Between(60, height - 60);
      const sprite = this.add.image(x, y, key)
        .setScale(0.16).setAlpha(0.1).setDepth(-1);
      this.tweens.add({
        targets: sprite, y: y - Phaser.Math.Between(15, 40),
        duration: Phaser.Math.Between(2500, 5000),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
        ease: 'Sine.easeInOut'
      });
    });
  }

  // ============================================================
  // BUTTON FACTORY
  // ============================================================
  createButton(x, y, w, h, label, color, glowColor, disabled = false, onClick) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    const drawBg = (hovered) => {
      bg.clear();
      bg.fillStyle(hovered ? glowColor : color, disabled ? 0.35 : 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      bg.lineStyle(1.5, hovered ? 0xc9a227 : 0x5a4a8a, disabled ? 0.25 : 0.7);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    };
    drawBg(false);

    const text = this.add.text(0, 0, label, {
      fontFamily: "'Inter', sans-serif", fontSize: '17px', fontStyle: 'bold',
      color: disabled ? 'rgba(180,170,220,0.35)' : '#ffffff'
    }).setOrigin(0.5);

    container.add([bg, text]);

    if (!disabled) {
      container.setSize(w, h).setInteractive({ useHandCursor: true });
      container.on('pointerover', () => { drawBg(true); this.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 100 }); });
      container.on('pointerout', () => { drawBg(false); this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 }); });
      container.on('pointerdown', () => {
        this.tweens.add({ targets: container, scaleX: 0.96, scaleY: 0.96, duration: 70, yoyo: true });
        this.time.delayedCall(140, onClick);
      });
    }

    // Entrance animation
    container.setAlpha(0).setY(y + 24);
    this.tweens.add({ targets: container, alpha: 1, y, duration: 450, delay: 100 + 80 * (this._menuObjects.length % 8), ease: 'Back.Out' });

    this._addMenuObj(container);
    return container;
  }

  _createBackButton(onClick) {
    const btn = this.add.text(40, 35, '← Quay Lại', {
      fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(180,170,220,0.8)'
    }).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setColor('#c9a227'));
    btn.on('pointerout', () => btn.setColor('rgba(180,170,220,0.8)'));
    btn.on('pointerdown', () => { soundManager.playClick(); onClick(); });
    return btn;
  }
}
