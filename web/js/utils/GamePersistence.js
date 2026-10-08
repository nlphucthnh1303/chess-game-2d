// ============================================================
// GameState persistence — Save/Load/Settings/Stats
// ============================================================

const SETTINGS_KEY = 'chibiChessSettings';
const STATS_KEY = 'chibiChessStats';
const SAVE_KEY = 'chibiChessSave';
const ACHIEVEMENTS_KEY = 'chibiChessAchievements';

// ============================================================
// Default Settings
// ============================================================
const DEFAULT_SETTINGS = {
  // Audio
  sfxEnabled: true,
  musicEnabled: true,
  sfxVolume: 0.7,
  musicVolume: 0.3,

  // Visual
  boardTheme: 'classic',    // classic | dark | forest | ocean | marble
  pieceTheme: 'chibi',      // chibi (only one for now)
  animationSpeed: 'normal', // slow | normal | fast
  showLegalMoves: true,
  showLastMove: true,
  showCoordinates: true,
  flipBoardForBlack: false,

  // Gameplay
  defaultMode: 'pvp',       // pvp | ai
  aiDifficulty: 'MEDIUM',
  aiColor: 'black',         // which color AI plays
  timerMode: 'unlimited',   // unlimited | bullet | blitz | rapid | classical

  // Language
  language: 'vi'            // vi | en
};

// ============================================================
// Board Themes
// ============================================================
export const BOARD_THEMES = {
  classic: {
    name: 'Cổ Điển',
    light: 0xf0d9b5,
    dark:  0xb58863,
    frame: 0x7a4f1e,
    frameInner: 0x9a6a30,
    coordColor: '#c9a227'
  },
  dark: {
    name: 'Bóng Đêm',
    light: 0x4a4a5a,
    dark:  0x2a2a3a,
    frame: 0x1a1a2a,
    frameInner: 0x2a2a3a,
    coordColor: '#7c6af7'
  },
  forest: {
    name: 'Rừng Xanh',
    light: 0xd4e8c2,
    dark:  0x5a8a4a,
    frame: 0x2a4a1a,
    frameInner: 0x3a6a2a,
    coordColor: '#8fd48a'
  },
  ocean: {
    name: 'Đại Dương',
    light: 0xc2d8e8,
    dark:  0x2a5a8a,
    frame: 0x0a1a2a,
    frameInner: 0x1a3a5a,
    coordColor: '#6ab4d4'
  },
  marble: {
    name: 'Cẩm Thạch',
    light: 0xf5f0e8,
    dark:  0x8a7a6a,
    frame: 0x3a2a2a,
    frameInner: 0x4a3a3a,
    coordColor: '#d4c4b4'
  }
};

// ============================================================
// Timer Modes
// ============================================================
export const TIMER_MODES = {
  unlimited: { name: 'Vô Hạn',   seconds: 0,    increment: 0 },
  bullet:    { name: 'Bullet 1m', seconds: 60,   increment: 0 },
  blitz:     { name: 'Blitz 3m',  seconds: 180,  increment: 2 },
  blitz5:    { name: 'Blitz 5m',  seconds: 300,  increment: 0 },
  rapid:     { name: 'Nhanh 10m', seconds: 600,  increment: 5 },
  classical: { name: 'Cổ Điển',  seconds: 1800, increment: 30 }
};

// ============================================================
// Settings Manager
// ============================================================
export class SettingsManager {
  constructor() {
    this._settings = { ...DEFAULT_SETTINGS };
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        this._settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {}
  }

  save() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this._settings));
    } catch {}
  }

  get(key) {
    return this._settings[key] ?? DEFAULT_SETTINGS[key];
  }

  set(key, value) {
    this._settings[key] = value;
    this.save();
  }

  getAll() {
    return { ...this._settings };
  }

  reset() {
    this._settings = { ...DEFAULT_SETTINGS };
    this.save();
  }

  getBoardTheme() {
    return BOARD_THEMES[this._settings.boardTheme] || BOARD_THEMES.classic;
  }

  getTimerMode() {
    return TIMER_MODES[this._settings.timerMode] || TIMER_MODES.unlimited;
  }

  getAnimationDuration(base = 320) {
    const speed = this._settings.animationSpeed;
    if (speed === 'slow') return base * 1.8;
    if (speed === 'fast') return base * 0.5;
    return base;
  }
}

// ============================================================
// Statistics Manager
// ============================================================
export class StatsManager {
  constructor() {
    this._stats = this._defaults();
    this.load();
  }

  _defaults() {
    return {
      totalGames: 0,
      wins: { white: 0, black: 0 },
      draws: 0,
      checkmates: 0,
      stalemates: 0,
      longestGame: 0,   // in moves
      shortestWin: Infinity,
      totalMoves: 0,
      captures: 0,
      promotions: 0,
      castles: 0,
      enPassants: 0,
      playTimeSeconds: 0,
      streak: { current: 0, best: 0, lastResult: null }
    };
  }

  load() {
    try {
      const saved = localStorage.getItem(STATS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this._stats = { ...this._defaults(), ...parsed };
      }
    } catch {}
  }

  save() {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(this._stats));
    } catch {}
  }

  get(key) { return this._stats[key]; }
  getAll() { return { ...this._stats }; }

  recordGameEnd(result, moveCount, playSeconds = 0) {
    this._stats.totalGames++;
    this._stats.totalMoves += moveCount;
    this._stats.playTimeSeconds += Math.floor(playSeconds);

    if (moveCount > this._stats.longestGame) this._stats.longestGame = moveCount;

    if (result === 'white_win') {
      this._stats.wins.white++;
      this._updateStreak('win');
    } else if (result === 'black_win') {
      this._stats.wins.black++;
      this._updateStreak('win');
    } else {
      this._stats.draws++;
      this._updateStreak('draw');
    }

    if ((result === 'white_win' || result === 'black_win') && moveCount < this._stats.shortestWin) {
      this._stats.shortestWin = moveCount;
    }

    this.save();
  }

  recordCheckmate() { this._stats.checkmates++; this.save(); }
  recordStalemate() { this._stats.stalemates++; this.save(); }
  recordCapture()   { this._stats.captures++;   this.save(); }
  recordPromotion() { this._stats.promotions++;  this.save(); }
  recordCastle()    { this._stats.castles++;     this.save(); }
  recordEnPassant() { this._stats.enPassants++;  this.save(); }

  _updateStreak(result) {
    const s = this._stats.streak;
    if (result === 'win') {
      s.current++;
      if (s.current > s.best) s.best = s.current;
    } else {
      s.current = 0;
    }
    s.lastResult = result;
  }

  getWinRate() {
    if (this._stats.totalGames === 0) return 0;
    return Math.round((this._stats.wins.white + this._stats.wins.black) / this._stats.totalGames * 100);
  }

  getFormattedPlayTime() {
    const secs = this._stats.playTimeSeconds;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} phút`;
  }

  reset() {
    this._stats = this._defaults();
    this.save();
  }
}

// ============================================================
// Achievements Manager
// ============================================================
export const ACHIEVEMENTS = [
  { id: 'first_move',     name: 'Bước Đầu Tiên',       desc: 'Thực hiện nước đi đầu tiên',         icon: '👣', condition: s => s.totalMoves >= 1 },
  { id: 'first_win',      name: 'Chiến Thắng Đầu Tiên', desc: 'Thắng ván cờ đầu tiên',              icon: '🏆', condition: s => s.wins.white + s.wins.black >= 1 },
  { id: 'scholar_mate',   name: 'Chiếu Hết Nhanh',      desc: 'Thắng trong vòng 10 nước',           icon: '⚡', condition: s => s.shortestWin <= 10 },
  { id: 'promoter',       name: 'Phong Cấp!',           desc: 'Phong cấp 1 quân Tốt',              icon: '👑', condition: s => s.promotions >= 1 },
  { id: 'castler',        name: 'Nhập Thành',           desc: 'Thực hiện nhập thành',               icon: '🏰', condition: s => s.castles >= 1 },
  { id: 'en_passant',     name: 'Bắt Qua Đường',        desc: 'Thực hiện bắt tốt qua đường',        icon: '🎯', condition: s => s.enPassants >= 1 },
  { id: 'ten_games',      name: 'Vận Động Viên',        desc: 'Chơi 10 ván cờ',                    icon: '🎮', condition: s => s.totalGames >= 10 },
  { id: 'hundred_games',  name: 'Kiện Tướng',           desc: 'Chơi 100 ván cờ',                   icon: '⚔️', condition: s => s.totalGames >= 100 },
  { id: 'five_wins',      name: 'Người Thắng Cuộc',     desc: 'Thắng 5 ván liên tiếp',             icon: '🔥', condition: s => s.streak.best >= 5 },
  { id: 'thirty_wins',    name: 'Đại Kiện Tướng',       desc: 'Thắng tổng cộng 30 ván',            icon: '🌟', condition: s => s.wins.white + s.wins.black >= 30 },
  { id: 'marathon',       name: 'Chiến Binh Bền Bỉ',   desc: 'Chơi tổng cộng 60 phút',            icon: '⏱️', condition: s => s.playTimeSeconds >= 3600 },
  { id: 'long_game',      name: 'Ván Cờ Trường Kỳ',    desc: 'Một ván cờ dài 100 nước',           icon: '📜', condition: s => s.longestGame >= 100 },
  { id: 'capture_100',    name: 'Kẻ Tàn Sát',          desc: 'Ăn tổng cộng 100 quân',             icon: '💀', condition: s => s.captures >= 100 },
  { id: 'checkmate_10',   name: 'Chiếu Bí Chuyên Gia', desc: 'Chiếu bí đối thủ 10 lần',           icon: '♟️', condition: s => s.checkmates >= 10 },
  { id: 'collector',      name: 'Nhà Sưu Tập',         desc: 'Mở khóa 10 thành tích',             icon: '🎖️', condition: (s, unlocked) => unlocked.length >= 10 },
];

export class AchievementsManager {
  constructor() {
    this._unlocked = new Set();
    this._newlyUnlocked = [];
    this.load();
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '[]');
      this._unlocked = new Set(saved);
    } catch {}
  }

  save() {
    try {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...this._unlocked]));
    } catch {}
  }

  checkAll(stats) {
    const unlocked = [...this._unlocked];
    const newlyUnlocked = [];
    
    for (const achievement of ACHIEVEMENTS) {
      if (this._unlocked.has(achievement.id)) continue;
      if (achievement.condition(stats, unlocked)) {
        this._unlocked.add(achievement.id);
        newlyUnlocked.push(achievement);
        unlocked.push(achievement.id);
      }
    }

    if (newlyUnlocked.length > 0) {
      this._newlyUnlocked.push(...newlyUnlocked);
      this.save();
    }

    return newlyUnlocked;
  }

  popNewAchievements() {
    const result = [...this._newlyUnlocked];
    this._newlyUnlocked = [];
    return result;
  }

  getUnlocked() {
    return ACHIEVEMENTS.filter(a => this._unlocked.has(a.id));
  }

  getLocked() {
    return ACHIEVEMENTS.filter(a => !this._unlocked.has(a.id));
  }

  isUnlocked(id) { return this._unlocked.has(id); }

  getProgress() {
    return { unlocked: this._unlocked.size, total: ACHIEVEMENTS.length };
  }

  reset() {
    this._unlocked.clear();
    this._newlyUnlocked = [];
    this.save();
  }
}

// ============================================================
// Game Save/Load Manager
// ============================================================
export class SaveManager {
  static serializeGameState(gameState, extraData = {}) {
    return JSON.stringify({
      version: '1.0',
      timestamp: Date.now(),
      gameState: {
        board: gameState.board.map(row => row.map(cell => cell ? { t: cell.type, c: cell.color } : null)),
        turn: gameState.turn,
        status: gameState.status,
        enPassantTarget: gameState.enPassantTarget,
        castlingRights: gameState.castlingRights,
        moveHistory: gameState.moveHistory.map(m => ({
          f: m.from, t: m.to, p: { t: m.piece?.type, c: m.piece?.color },
          cap: m.captured ? { t: m.captured.type, c: m.captured.color } : null,
          fl: m.flags, pt: m.promotionType, n: m.notation
        })),
        capturedPieces: gameState.capturedPieces,
        halfMoveClock: gameState.halfMoveClock,
        fullMoveNumber: gameState.fullMoveNumber
      },
      ...extraData
    });
  }

  static deserializeGameState(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      const gs = data.gameState;
      
      return {
        board: gs.board.map(row => row.map(cell => cell ? { type: cell.t, color: cell.c } : null)),
        turn: gs.turn,
        status: gs.status,
        enPassantTarget: gs.enPassantTarget,
        castlingRights: gs.castlingRights,
        moveHistory: gs.moveHistory.map(m => ({
          from: m.f, to: m.t,
          piece: m.p ? { type: m.p.t, color: m.p.c } : null,
          captured: m.cap ? { type: m.cap.t, color: m.cap.c } : null,
          flags: m.fl || [],
          promotionType: m.pt,
          notation: m.n
        })),
        capturedPieces: gs.capturedPieces,
        halfMoveClock: gs.halfMoveClock || 0,
        fullMoveNumber: gs.fullMoveNumber || 1
      };
    } catch (e) {
      console.error('Failed to deserialize game state:', e);
      return null;
    }
  }

  static saveToLocal(gameState, extraData = {}) {
    try {
      localStorage.setItem(SAVE_KEY, SaveManager.serializeGameState(gameState, extraData));
      return true;
    } catch { return false; }
  }

  static loadFromLocal() {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) return null;
      return SaveManager.deserializeGameState(saved);
    } catch { return null; }
  }

  static hasSavedGame() {
    return !!localStorage.getItem(SAVE_KEY);
  }

  static clearSave() {
    localStorage.removeItem(SAVE_KEY);
  }
}

// ============================================================
// Singleton exports
// ============================================================
export const settingsManager = new SettingsManager();
export const statsManager = new StatsManager();
export const achievementsManager = new AchievementsManager();
