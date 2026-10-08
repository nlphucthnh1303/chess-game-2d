// ============================================================
// GameScene.js — Main gameplay scene (PvP + PvAI + AI vs AI)
// Full-featured: Timer, AI, Sound, Themes, Achievements, Save/Load
// ============================================================
import {
  createGameState, getLegalMoves, makeMove, undoMove,
  GameStatus, Color, PieceType
} from '../chess/ChessLogic.js';
import { ChessAI } from '../chess/ChessAI.js';
import { SpriteUtils } from '../utils/SpriteUtils.js';
import { soundManager } from '../utils/SoundManager.js';
import { settingsManager, statsManager, achievementsManager, BOARD_THEMES, TIMER_MODES, SaveManager } from '../utils/GamePersistence.js';

// Board visual constants
const TILE = 80;
const BOARD_COLS = 8;
const BOARD_ROWS = 8;
const BOARD_W = TILE * BOARD_COLS;
const BOARD_H = TILE * BOARD_ROWS;
const FRAME = 40;
const SIDEBAR_W = 240;
const COL_LETTERS = 'abcdefgh';

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.mode = data?.mode || settingsManager.get('defaultMode') || 'pvp';
    this.aiDifficulty = data?.aiDifficulty || settingsManager.get('aiDifficulty') || 'MEDIUM';
    this.aiColor = data?.aiColor || settingsManager.get('aiColor') || Color.BLACK;
    this.timerMode = data?.timerMode || settingsManager.get('timerMode') || 'unlimited';
    this.loadedState = data?.loadedState || null;
    this._gameStartTime = Date.now();
  }

  create() {
    const { width, height } = this.scale;
    soundManager.resume();

    // Load board theme from settings
    this.theme = settingsManager.getBoardTheme();

    // Layout
    this.boardOriginX = FRAME + 32;
    this.boardOriginY = (height - BOARD_H) / 2;

    // Game state
    this.gameState = this.loadedState || createGameState();
    this.selectedCell = null;
    this.legalMoves = [];
    this.isAnimating = false;
    this.promotionPending = null;
    this.gameOver = false;
    this.isFlipped = false;

    // AI setup
    this.ai = null;
    this.aiThinking = false;
    if (this.mode === 'ai' || this.mode === 'ai_vs_ai') {
      this.ai = new ChessAI(this.aiDifficulty);
      this.ai.setColor(this.aiColor === 'white' ? Color.WHITE : Color.BLACK);
    }

    // Timer state
    const timerConfig = TIMER_MODES[this.timerMode] || TIMER_MODES.unlimited;
    this.timerEnabled = timerConfig.seconds > 0;
    this.timerIncrement = timerConfig.increment;
    this.timers = {
      [Color.WHITE]: timerConfig.seconds,
      [Color.BLACK]: timerConfig.seconds
    };
    this.lastTimerTick = null;

    // Build scene
    this.createBackground(width, height);
    this.createBoardGraphics();
    this.createSidebar(width, height);
    this.createHighlightLayers();
    this.createPieceSprites();
    this.createInputHandlers();
    this.createKeyboardShortcuts();
    this.updateSidebar();
    this.drawHighlights();

    // Start ambient music
    if (!soundManager._musicPlaying) soundManager.startAmbientMusic();

    // If it's AI's turn from the start (loaded state or AI plays white)
    this.time.delayedCall(500, () => this.tryAIMove());

    // Electron menu actions
    if (window.electronAPI) {
      window.electronAPI.onMenuAction((action) => {
        switch (action) {
          case 'new-game':   this.handleNewGame();  break;
          case 'undo':       this.handleUndo();     break;
          case 'save-game':  this.handleSave();     break;
          case 'load-game':  this.handleLoad();     break;
          case 'go-menu':    this.handleMenu();     break;
          case 'show-help':  this.showHelpOverlay(); break;
          case 'show-achievements': this.showAchievementsOverlay(); break;
        }
      });
    }
  }

  // ============================================================
  // UPDATE LOOP — Timer management
  // ============================================================
  update(time, delta) {
    if (!this.timerEnabled || this.gameOver || this.isAnimating || this.aiThinking) return;

    const now = Date.now();
    if (!this.lastTimerTick) { this.lastTimerTick = now; return; }

    const elapsed = (now - this.lastTimerTick) / 1000;
    this.lastTimerTick = now;

    const { turn } = this.gameState;
    this.timers[turn] -= elapsed;

    if (this.timers[turn] <= 0) {
      this.timers[turn] = 0;
      this.handleTimeOut(turn);
    }

    // Warning sound when < 10 seconds
    if (this.timers[turn] < 10 && this.timers[turn] > 9.5) {
      soundManager.playTimerWarn();
    }

    this.updateTimerDisplay();
  }

  handleTimeOut(loserColor) {
    this.gameOver = true;
    const winner = loserColor === Color.WHITE ? Color.BLACK : Color.WHITE;
    this.time.delayedCall(100, () => {
      this.showGameEndDialog('timeout', winner);
    });
    soundManager.playGameOver(false);
    statsManager.recordGameEnd(winner === Color.WHITE ? 'white_win' : 'black_win',
      this.gameState.moveHistory.length, (Date.now() - this._gameStartTime) / 1000);
    this.checkAchievements();
  }

  // ============================================================
  // BACKGROUND
  // ============================================================
  createBackground(width, height) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0a1a, 0x0d0a1a, 0x1a0a3e, 0x1a0a3e, 1);
    bg.fillRect(0, 0, width, height);

    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const r = Phaser.Math.FloatBetween(0.4, 2);
      const a = Phaser.Math.FloatBetween(0.15, 0.7);
      const star = this.add.circle(x, y, r, 0xffffff, a);
      this.tweens.add({
        targets: star, alpha: { from: a, to: a * 0.2 },
        duration: Phaser.Math.Between(1200, 4000),
        yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 3000)
      });
    }
  }

  // ============================================================
  // BOARD GRAPHICS
  // ============================================================
  createBoardGraphics() {
    const ox = this.boardOriginX, oy = this.boardOriginY;
    const theme = this.theme;

    // Outer glow
    const glow = this.add.graphics();
    glow.fillStyle(0x7c6af7, 0.07);
    glow.fillRoundedRect(ox - FRAME - 8, oy - FRAME - 8, BOARD_W + (FRAME + 8) * 2, BOARD_H + (FRAME + 8) * 2, 16);

    // Wooden frame
    const frame = this.add.graphics();
    frame.fillStyle(theme.frame, 1);
    frame.fillRoundedRect(ox - FRAME, oy - FRAME, BOARD_W + FRAME * 2, BOARD_H + FRAME * 2, 8);
    frame.fillStyle(theme.frameInner, 1);
    frame.fillRoundedRect(ox - FRAME + 4, oy - FRAME + 4, BOARD_W + FRAME * 2 - 8, BOARD_H + FRAME * 2 - 8, 6);
    frame.lineStyle(1.5, 0xc9a227, 0.8);
    frame.strokeRoundedRect(ox - FRAME, oy - FRAME, BOARD_W + FRAME * 2, BOARD_H + FRAME * 2, 8);

    // Tiles
    this.boardTiles = this.add.graphics();
    this.drawTiles();

    // Coord labels
    if (settingsManager.get('showCoordinates')) {
      this.createCoordLabels(ox, oy);
    }
  }

  drawTiles() {
    const g = this.boardTiles;
    g.clear();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const displayRow = this.isFlipped ? (7 - r) : r;
        const displayCol = this.isFlipped ? (7 - c) : c;
        g.fillStyle((displayRow + displayCol) % 2 === 0 ? this.theme.light : this.theme.dark, 1);
        g.fillRect(
          this.boardOriginX + c * TILE,
          this.boardOriginY + r * TILE,
          TILE, TILE
        );
      }
    }
  }

  createCoordLabels(ox, oy) {
    const style = {
      fontFamily: "'Cinzel', serif",
      fontSize: '12px',
      fontStyle: 'bold',
      color: this.theme.coordColor || '#c9a227'
    };

    this._coordLabels = [];
    for (let i = 0; i < 8; i++) {
      const letter = this.isFlipped ? COL_LETTERS[7 - i] : COL_LETTERS[i];
      const num = this.isFlipped ? String(i + 1) : String(8 - i);
      const lx = ox + i * TILE + TILE / 2;
      const ly = oy + i * TILE + TILE / 2;

      this._coordLabels.push(
        this.add.text(lx, oy + BOARD_H + 10, letter, style).setOrigin(0.5, 0),
        this.add.text(lx, oy - 22, letter, style).setOrigin(0.5, 1),
        this.add.text(ox - 15, ly, num, style).setOrigin(1, 0.5),
        this.add.text(ox + BOARD_W + 15, ly, num, style).setOrigin(0, 0.5)
      );
    }
  }

  // ============================================================
  // HIGHLIGHT LAYERS
  // ============================================================
  createHighlightLayers() {
    this.hlGraphics = this.add.graphics();
    this.dotGraphics = this.add.graphics();
  }

  drawHighlights() {
    const g = this.hlGraphics;
    const d = this.dotGraphics;
    g.clear(); d.clear();

    const { board, moveHistory, status, turn } = this.gameState;
    const ox = this.boardOriginX, oy = this.boardOriginY;
    const showLast = settingsManager.get('showLastMove');
    const showLegal = settingsManager.get('showLegalMoves');

    // Last move highlight
    if (showLast && moveHistory.length > 0) {
      const last = moveHistory[moveHistory.length - 1];
      const [fr, fc] = this.boardToDisplay(last.from.row, last.from.col);
      const [tr, tc] = this.boardToDisplay(last.to.row, last.to.col);
      g.fillStyle(0xffd700, 0.35);
      g.fillRect(ox + fc * TILE, oy + fr * TILE, TILE, TILE);
      g.fillRect(ox + tc * TILE, oy + tr * TILE, TILE, TILE);
    }

    // Check highlight
    if (status === GameStatus.CHECK || status === GameStatus.CHECKMATE) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p?.type === PieceType.KING && p?.color === turn) {
            const [dr, dc] = this.boardToDisplay(r, c);
            g.fillStyle(0xff4444, 0.6);
            g.fillRect(ox + dc * TILE, oy + dr * TILE, TILE, TILE);
          }
        }
      }
    }

    // Selected cell
    if (this.selectedCell) {
      const { row, col } = this.selectedCell;
      const [dr, dc] = this.boardToDisplay(row, col);
      g.fillStyle(0xf6f669, 0.5);
      g.fillRect(ox + dc * TILE, oy + dr * TILE, TILE, TILE);

      if (showLegal) {
        this.legalMoves.forEach(m => {
          const [tr, tc] = this.boardToDisplay(m.to.row, m.to.col);
          const hasEnemy = !!board[m.to.row][m.to.col];

          if (hasEnemy || m.flags?.includes('enPassant')) {
            d.lineStyle(5, 0x333333, 0.7);
            d.strokeCircle(ox + tc * TILE + TILE / 2, oy + tr * TILE + TILE / 2, TILE / 2 - 3);
          } else {
            d.fillStyle(0x2d2d2d, 0.35);
            d.fillCircle(ox + tc * TILE + TILE / 2, oy + tr * TILE + TILE / 2, TILE / 6);
          }
        });
      }
    }
  }

  // ============================================================
  // BOARD FLIP HELPER
  // ============================================================
  boardToDisplay(row, col) {
    if (this.isFlipped) return [7 - row, 7 - col];
    return [row, col];
  }

  displayToBoard(dRow, dCol) {
    if (this.isFlipped) return [7 - dRow, 7 - dCol];
    return [dRow, dCol];
  }

  // ============================================================
  // PIECE SPRITES
  // ============================================================
  createPieceSprites() {
    this.pieceSprites = {};
    const { board } = this.gameState;
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (board[r][c]) this.spawnSprite(r, c, board[r][c]);
  }

  spawnSprite(row, col, piece) {
    const key = `${row},${col}`;
    const textureKey = SpriteUtils.getKey(piece.color, piece.type);
    const [dr, dc] = this.boardToDisplay(row, col);
    const { x, y } = this.cellToWorld(dr, dc);

    let sprite;
    if (this.textures.exists(textureKey)) {
      sprite = this.add.image(x, y, textureKey);
      const tileScale = (TILE * 0.85) / Math.max(sprite.width, sprite.height);
      sprite.setScale(tileScale);
    } else {
      sprite = this.createFallbackPiece(x, y, piece);
    }

    sprite.setDepth(2);

    // Idle bob
    this.tweens.add({
      targets: sprite, y: y - 4,
      duration: 1200 + Math.random() * 800,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      delay: Math.random() * 1000
    });

    this.pieceSprites[key] = sprite;
    return sprite;
  }

  createFallbackPiece(x, y, piece) {
    const container = this.add.container(x, y);
    const isWhite = piece.color === Color.WHITE;
    const typeLabels = { P: '♟', R: '♜', N: '♞', B: '♝', Q: '♛', K: '♚' };
    const shadow = this.add.ellipse(0, 22, 50, 12, 0x000000, 0.3);
    const body = this.add.circle(0, 0, 30, isWhite ? 0xdde8f8 : 0x221133, 1)
      .setStrokeStyle(2, isWhite ? 0x9bb5cc : 0x6644aa);
    const label = this.add.text(0, 0, typeLabels[piece.type] || '?', {
      fontSize: '24px', color: isWhite ? '#334466' : '#c090ff'
    }).setOrigin(0.5);
    container.add([shadow, body, label]);
    return container;
  }

  destroySprite(row, col) {
    const key = `${row},${col}`;
    if (this.pieceSprites[key]) {
      this.tweens.killTweensOf(this.pieceSprites[key]);
      this.pieceSprites[key].destroy();
      delete this.pieceSprites[key];
    }
  }

  moveSprite(fromRow, fromCol, toRow, toCol, onComplete) {
    const fromKey = `${fromRow},${fromCol}`;
    const sprite = this.pieceSprites[fromKey];
    if (!sprite) { onComplete?.(); return; }

    delete this.pieceSprites[fromKey];
    this.tweens.killTweensOf(sprite);

    const [dr, dc] = this.boardToDisplay(toRow, toCol);
    const { x, y } = this.cellToWorld(dr, dc);
    sprite.setDepth(5);

    const duration = settingsManager.getAnimationDuration(300);
    this.tweens.add({
      targets: sprite, x, y,
      duration,
      ease: 'Back.Out',
      onComplete: () => {
        sprite.setDepth(2);
        const toKey = `${toRow},${toCol}`;
        this.pieceSprites[toKey] = sprite;
        this.tweens.add({
          targets: sprite, y: y - 4,
          duration: 1200 + Math.random() * 800,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
        this.spawnDustParticles(x, y);
        onComplete?.();
      }
    });
  }

  spawnDustParticles(x, y) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const px = x + Math.cos(angle) * 20;
      const py = y + 20 + Math.sin(angle) * 8;
      let dot;
      if (this.textures.exists('particle')) {
        dot = this.add.image(px, py, 'particle').setScale(0.4).setAlpha(0.7).setDepth(6);
      } else {
        dot = this.add.circle(px, py, 3, 0xffffff, 0.6).setDepth(6);
      }
      this.tweens.add({
        targets: dot, x: px + Math.cos(angle) * 15, y: py - 10,
        alpha: 0, scale: 0, duration: 400, ease: 'Power2',
        onComplete: () => dot.destroy()
      });
    }
  }

  refreshAllSprites() {
    Object.values(this.pieceSprites).forEach(s => {
      this.tweens.killTweensOf(s);
      s.destroy();
    });
    this.pieceSprites = {};
    this.createPieceSprites();
  }

  // ============================================================
  // SIDEBAR
  // ============================================================
  createSidebar(width, height) {
    const sx = this.boardOriginX + BOARD_W + FRAME + 10;
    const sy = this.boardOriginY;
    const sw = SIDEBAR_W;
    const sh = BOARD_H;

    this.sidebarX = sx;
    this.sidebarY = sy;
    this.sidebarW = sw;
    this.sidebarH = sh;

    const panel = this.add.graphics();
    panel.fillStyle(0x120d24, 0.95);
    panel.fillRoundedRect(sx, sy, sw, sh, 12);
    panel.lineStyle(1, 0x3a2a5a, 1);
    panel.strokeRoundedRect(sx, sy, sw, sh, 12);

    const pad = 14;
    const cx = sx + sw / 2;

    // Player banners
    this._createPlayerBanner(cx, sy + pad + 28, Color.BLACK, '🖤 Đội Đen');
    this._createPlayerBanner(cx, sy + sh - pad - 28, Color.WHITE, '🤍 Đội Trắng');

    // Timers
    this.timerBlack = this.add.text(cx, sy + pad + 56, '', {
      fontFamily: "'Cinzel', serif", fontSize: '22px', fontStyle: 'bold',
      color: '#c090ff', align: 'center'
    }).setOrigin(0.5).setDepth(3);

    this.timerWhite = this.add.text(cx, sy + sh - pad - 56, '', {
      fontFamily: "'Cinzel', serif", fontSize: '22px', fontStyle: 'bold',
      color: '#dde8f8', align: 'center'
    }).setOrigin(0.5).setDepth(3);

    // Turn indicator
    this.turnBg = this.add.graphics();
    this.turnText = this.add.text(cx, sy + sh / 2 - 65, '', {
      fontFamily: "'Cinzel', serif", fontSize: '14px', fontStyle: 'bold',
      color: '#f0d9b5', align: 'center'
    }).setOrigin(0.5).setDepth(3);

    // Status text
    this.statusText = this.add.text(cx, sy + sh / 2 - 40, '', {
      fontFamily: "'Inter', sans-serif", fontSize: '13px',
      color: '#ff8888', align: 'center', wordWrap: { width: sw - 20 }
    }).setOrigin(0.5).setDepth(3);

    // AI thinking indicator
    this.aiThinkingText = this.add.text(cx, sy + sh / 2 - 20, '', {
      fontFamily: "'Inter', sans-serif", fontSize: '12px',
      color: '#aaa', align: 'center'
    }).setOrigin(0.5).setDepth(3);

    // Move counter
    this.moveCountText = this.add.text(cx, sy + sh / 2, '', {
      fontFamily: "'Inter', sans-serif", fontSize: '12px',
      color: 'rgba(200,190,255,0.7)', align: 'center'
    }).setOrigin(0.5).setDepth(3);

    // Last move
    this.add.text(sx + pad, sy + sh / 2 + 22, 'Nước cuối:', {
      fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(180,170,220,0.7)'
    }).setDepth(3);
    this.lastMoveText = this.add.text(cx, sy + sh / 2 + 38, '—', {
      fontFamily: "'Cinzel', serif", fontSize: '16px', fontStyle: 'bold',
      color: '#c9a227', align: 'center'
    }).setOrigin(0.5).setDepth(3);

    // Captured pieces
    this.add.text(sx + pad, sy + sh / 2 + 60, '⚔ Trắng bắt:', {
      fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(200,190,255,0.6)'
    }).setDepth(3);
    this.capturedWhiteText = this.add.text(sx + pad, sy + sh / 2 + 76, '', {
      fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#dde8f8', wordWrap: { width: sw - pad * 2 }
    }).setDepth(3);
    this.add.text(sx + pad, sy + sh / 2 + 96, '⚔ Đen bắt:', {
      fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(200,190,255,0.6)'
    }).setDepth(3);
    this.capturedBlackText = this.add.text(sx + pad, sy + sh / 2 + 112, '', {
      fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#c090ff', wordWrap: { width: sw - pad * 2 }
    }).setDepth(3);

    // Buttons
    const btnW = sw - 20, btnH = 32;
    const btnX = cx;
    let btnY = sy + sh - 160;
    this._createSidebarButton(btnX, btnY, '↩  Hoàn Tác', 0x2a1a4a, 0x5040a0, () => { soundManager.playClick(); this.handleUndo(); });
    btnY += 40;
    this._createSidebarButton(btnX, btnY, '⟳  Ván Mới', 0x1a2a1a, 0x2a5a2a, () => { soundManager.playClick(); this.handleNewGame(); });
    btnY += 40;
    this._createSidebarButton(btnX, btnY, '⇌  Lật Bàn', 0x1a1a2a, 0x3a3a5a, () => { soundManager.playClick(); this.flipBoard(); });
    btnY += 40;
    this._createSidebarButton(btnX, btnY, '🏠  Menu', 0x2a1a1a, 0x5a2a2a, () => { soundManager.playClick(); this.handleMenu(); });
  }

  _createPlayerBanner(cx, cy, color, label) {
    const isWhite = color === Color.WHITE;
    const bg = this.add.graphics();
    bg.fillStyle(isWhite ? 0x1a2a3a : 0x2a1a3a, 0.8);
    bg.fillRoundedRect(cx - 100, cy - 18, 200, 34, 8);
    bg.lineStyle(1, isWhite ? 0x4a6a9a : 0x6a3a9a, 0.6);
    bg.strokeRoundedRect(cx - 100, cy - 18, 200, 34, 8);

    let modeLabel = '';
    if (this.mode === 'ai') {
      if ((color === Color.BLACK && this.aiColor === 'black') || (color === Color.WHITE && this.aiColor === 'white')) {
        modeLabel = ' 🤖';
      }
    }

    this.add.text(cx, cy, label + modeLabel, {
      fontFamily: "'Cinzel', serif", fontSize: '13px', fontStyle: 'bold',
      color: isWhite ? '#dde8f8' : '#c090ff', align: 'center'
    }).setOrigin(0.5).setDepth(3);
  }

  _createSidebarButton(cx, cy, label, color, hoverColor, onClick) {
    const w = this.sidebarW - 20, h = 30;
    const bg = this.add.graphics();
    const drawBg = (hovered) => {
      bg.clear();
      bg.fillStyle(hovered ? hoverColor : color, 1);
      bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 6);
      bg.lineStyle(1, 0x4a3a6a, 0.7);
      bg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 6);
    };
    drawBg(false);
    this.add.text(cx, cy, label, {
      fontFamily: "'Inter', sans-serif", fontSize: '13px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5).setDepth(3);

    const hitzone = this.add.rectangle(cx, cy, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true }).setDepth(4);
    hitzone.on('pointerover', () => drawBg(true));
    hitzone.on('pointerout', () => drawBg(false));
    hitzone.on('pointerdown', onClick);
  }

  updateSidebar() {
    const { gameState } = this;
    const { turn, status, moveHistory, capturedPieces, fullMoveNumber } = gameState;
    const cx = this.sidebarX + this.sidebarW / 2;
    const isWhite = turn === Color.WHITE;

    // Turn indicator
    this.turnBg.clear();
    this.turnBg.fillStyle(isWhite ? 0x223344 : 0x2a1a3a, 0.9);
    this.turnBg.fillRoundedRect(
      this.sidebarX + 8, this.sidebarY + this.sidebarH / 2 - 77,
      this.sidebarW - 16, 22, 5
    );
    this.turnText
      .setText(isWhite ? '🤍 Lượt: Đội Trắng' : '🖤 Lượt: Đội Đen')
      .setColor(isWhite ? '#dde8f8' : '#c090ff');

    // Status
    const msgs = {
      [GameStatus.ACTIVE]: '',
      [GameStatus.CHECK]: '⚠ Đang Bị Chiếu!',
      [GameStatus.CHECKMATE]: isWhite ? '💀 Đội Đen Thắng!' : '🏆 Đội Trắng Thắng!',
      [GameStatus.STALEMATE]: '🤝 Hòa — Bế Tắc!',
      [GameStatus.DRAW]: '🤝 Hòa!'
    };
    this.statusText.setText(msgs[status] || '');

    // AI thinking
    const modeLabel = this.aiThinking ? `🤖 AI đang suy nghĩ...` : '';
    this.aiThinkingText?.setText(modeLabel);

    this.moveCountText.setText(`Nước thứ: ${fullMoveNumber}`);

    const lastEntry = moveHistory[moveHistory.length - 1];
    this.lastMoveText.setText(lastEntry?.notation || '—');

    const pieceSymbols = { P: '♟', R: '♜', N: '♞', B: '♝', Q: '♛', K: '♚' };
    const whiteCap = capturedPieces[Color.WHITE].map(p => pieceSymbols[p.type]).join('');
    const blackCap = capturedPieces[Color.BLACK].map(p => pieceSymbols[p.type]).join('');
    this.capturedWhiteText.setText(whiteCap || '—');
    this.capturedBlackText.setText(blackCap || '—');

    this.updateTimerDisplay();
  }

  updateTimerDisplay() {
    if (!this.timerEnabled) {
      this.timerWhite?.setText('');
      this.timerBlack?.setText('');
      return;
    }

    const fmt = (secs) => {
      const s = Math.max(0, Math.floor(secs));
      const m = Math.floor(s / 60);
      const ss = s % 60;
      return `${m}:${ss.toString().padStart(2, '0')}`;
    };

    const wSecs = this.timers[Color.WHITE];
    const bSecs = this.timers[Color.BLACK];

    this.timerWhite?.setText(fmt(wSecs)).setColor(wSecs < 10 ? '#ff4444' : '#dde8f8');
    this.timerBlack?.setText(fmt(bSecs)).setColor(bSecs < 10 ? '#ff4444' : '#c090ff');
  }

  // ============================================================
  // INPUT
  // ============================================================
  createInputHandlers() {
    this.input.on('pointerdown', (pointer) => {
      if (this.isAnimating || this.aiThinking || this.promotionPending) return;
      soundManager.resume();

      // Check if clicking sidebar area
      if (pointer.x > this.boardOriginX + BOARD_W + FRAME) return;

      const cell = this.worldToCell(pointer.x, pointer.y);
      if (!cell) { this.clearSelection(); return; }
      this.handleCellClick(cell.row, cell.col);
    });
  }

  createKeyboardShortcuts() {
    this.input.keyboard.on('keydown-Z', (e) => {
      if (e.ctrlKey || e.metaKey) this.handleUndo();
    });
    this.input.keyboard.on('keydown-N', (e) => {
      if (e.ctrlKey || e.metaKey) this.handleNewGame();
    });
    this.input.keyboard.on('keydown-F', () => this.flipBoard());
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.selectedCell) this.clearSelection();
    });
  }

  handleCellClick(dRow, dCol) {
    const [row, col] = this.displayToBoard(dRow, dCol);
    const { gameState, selectedCell, legalMoves } = this;
    const { board, turn, status } = gameState;

    if (status === GameStatus.CHECKMATE || status === GameStatus.STALEMATE ||
        status === GameStatus.DRAW || this.gameOver) return;

    // AI's turn — don't let human move
    if (this.mode === 'ai' && turn === this.ai.color) return;

    if (selectedCell) {
      const matchingMove = legalMoves.find(m => m.to.row === row && m.to.col === col);
      if (matchingMove) {
        this.executeMove(matchingMove);
        return;
      }
    }

    const piece = board[row][col];
    if (piece && piece.color === turn) {
      this.selectedCell = { row, col };
      this.legalMoves = getLegalMoves(gameState, row, col);
      this.drawHighlights();
      this.animatePieceSelect(row, col);
    } else {
      this.clearSelection();
    }
  }

  animatePieceSelect(row, col) {
    const key = `${row},${col}`;
    const sprite = this.pieceSprites[key];
    if (!sprite) return;
    this.tweens.killTweensOf(sprite);
    const scaleX = sprite.scaleX || 1;
    const scaleY = sprite.scaleY || 1;
    this.tweens.add({
      targets: sprite, scaleX: scaleX * 1.15, scaleY: scaleY * 1.15,
      duration: 150, yoyo: true, ease: 'Back.Out'
    });
  }

  clearSelection() {
    this.selectedCell = null;
    this.legalMoves = [];
    this.drawHighlights();
  }

  // ============================================================
  // EXECUTE MOVE
  // ============================================================
  executeMove(move) {
    if (this.gameOver) return;
    const { from, to, flags = [] } = move;
    const piece = this.gameState.board[from.row][from.col];
    this.isAnimating = true;
    this.clearSelection();

    if (flags.includes('promotion')) {
      if (this.mode === 'ai' && this.gameState.turn === this.ai.color) {
        this.performMove(move, PieceType.QUEEN);
      } else {
        this.showPromotionDialog(move, piece.color);
      }
      return;
    }

    this.performMove(move, PieceType.QUEEN);
  }

  performMove(move, promotionType) {
    const { from, to, flags = [] } = move;
    const prevState = this.gameState;

    // Play sound based on move type
    if (flags.includes('castleKing') || flags.includes('castleQueen')) {
      soundManager.playCastle();
      statsManager.recordCastle();
    } else if (prevState.board[to.row][to.col] || flags.includes('enPassant')) {
      soundManager.playCapture();
      statsManager.recordCapture();
      if (flags.includes('enPassant')) statsManager.recordEnPassant();
    } else {
      soundManager.playMove();
    }

    // Capture animation
    if (prevState.board[to.row][to.col]) this.animateCapture(to.row, to.col);
    if (flags.includes('enPassant')) this.animateCapture(from.row, to.col);

    // Castling — move rook
    if (flags.includes('castleKing')) {
      const r = from.row;
      this.moveSprite(r, 7, r, 5, null);
    }
    if (flags.includes('castleQueen')) {
      const r = from.row;
      this.moveSprite(r, 0, r, 3, null);
    }

    // Move main piece
    this.moveSprite(from.row, from.col, to.row, to.col, () => {
      this.gameState = makeMove(this.gameState, move, promotionType);

      // Promotion
      if (flags.includes('promotion')) {
        soundManager.playPromotion();
        statsManager.recordPromotion();
        this.destroySprite(to.row, to.col);
        const newPiece = this.gameState.board[to.row][to.col];
        this.spawnSprite(to.row, to.col, newPiece);
      }

      // Timer increment
      if (this.timerEnabled) {
        this.timers[prevState.turn] += this.timerIncrement;
        this.lastTimerTick = Date.now();
      }

      this.isAnimating = false;
      this.drawHighlights();
      this.updateSidebar();
      this.checkGameEnd();

      // Save auto
      SaveManager.saveToLocal(this.gameState, { mode: this.mode, timerMode: this.timerMode });

      // Check achievements
      this.checkAchievements();

      // AI's turn
      this.time.delayedCall(100, () => this.tryAIMove());
    });
  }

  animateCapture(row, col) {
    const key = `${row},${col}`;
    const sprite = this.pieceSprites[key];
    if (!sprite) return;
    this.tweens.killTweensOf(sprite);
    this.tweens.add({
      targets: sprite, scaleX: 0, scaleY: 0, alpha: 0,
      duration: 180, ease: 'Power2',
      onComplete: () => { sprite.destroy(); delete this.pieceSprites[key]; }
    });
  }

  // ============================================================
  // AI
  // ============================================================
  async tryAIMove() {
    if (this.gameOver || this.isAnimating || this.aiThinking) return;
    const { status, turn } = this.gameState;
    if (status !== GameStatus.ACTIVE && status !== GameStatus.CHECK) return;

    // PvAI: check if it's AI's turn
    if (this.mode === 'ai') {
      if (turn !== this.ai.color) return;
    } else if (this.mode === 'ai_vs_ai') {
      // AI vs AI: always AI's turn
    } else {
      return; // PvP — no AI
    }

    this.aiThinking = true;
    this.aiThinkingText?.setText(`🤖 AI đang suy nghĩ...`);

    try {
      const move = await this.ai.getBestMoveAsync(this.gameState);
      if (move && !this.gameOver) {
        this.aiThinking = false;
        this.aiThinkingText?.setText('');
        this.executeMove(move);
      } else {
        this.aiThinking = false;
        this.aiThinkingText?.setText('');
      }
    } catch (e) {
      this.aiThinking = false;
      this.aiThinkingText?.setText('');
    }
  }

  // ============================================================
  // GAME END
  // ============================================================
  checkGameEnd() {
    const { status, turn } = this.gameState;
    if (status === GameStatus.CHECKMATE) {
      soundManager.playGameOver(true);
      statsManager.recordCheckmate();
      const winner = turn === Color.WHITE ? Color.BLACK : Color.WHITE;
      statsManager.recordGameEnd(winner === Color.WHITE ? 'white_win' : 'black_win',
        this.gameState.moveHistory.length, (Date.now() - this._gameStartTime) / 1000);
      this.gameOver = true;
      this.time.delayedCall(700, () => this.showGameEndDialog('checkmate', winner));
    } else if (status === GameStatus.STALEMATE) {
      soundManager.playGameOver(false);
      statsManager.recordStalemate();
      statsManager.recordGameEnd('draw', this.gameState.moveHistory.length, (Date.now() - this._gameStartTime) / 1000);
      this.gameOver = true;
      this.time.delayedCall(700, () => this.showGameEndDialog('stalemate', null));
    } else if (status === GameStatus.DRAW) {
      soundManager.playGameOver(false);
      statsManager.recordGameEnd('draw', this.gameState.moveHistory.length, (Date.now() - this._gameStartTime) / 1000);
      this.gameOver = true;
      this.time.delayedCall(700, () => this.showGameEndDialog('draw', null));
    } else if (status === GameStatus.CHECK) {
      soundManager.playCheck();
      this.flashCheckIndicator();
    }
  }

  flashCheckIndicator() {
    const g = this.add.graphics().setDepth(10);
    const { width, height } = this.scale;
    let count = 0;
    const flash = () => {
      g.clear();
      if (count % 2 === 0) { g.lineStyle(4, 0xff4444, 0.8); g.strokeRect(0, 0, width, height); }
      count++;
      if (count < 6) this.time.delayedCall(200, flash);
      else g.destroy();
    };
    flash();
  }

  // ============================================================
  // DIALOGS
  // ============================================================
  showPromotionDialog(move, color) {
    const { width, height } = this.scale;
    const isWhite = color === Color.WHITE;
    const choices = [PieceType.QUEEN, PieceType.ROOK, PieceType.BISHOP, PieceType.KNIGHT];
    const labels = { Q: '♛ Hậu', R: '♜ Xe', B: '♝ Tượng', N: '♞ Mã' };
    this.promotionPending = true;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setDepth(20).setInteractive();
    const dlgW = 380, dlgH = 180;
    const dlg = this.add.graphics().setDepth(21);
    dlg.fillStyle(0x1a0a2e, 1);
    dlg.fillRoundedRect(width / 2 - dlgW / 2, height / 2 - dlgH / 2, dlgW, dlgH, 12);
    dlg.lineStyle(2, isWhite ? 0x4a6a9a : 0x6a3a9a, 1);
    dlg.strokeRoundedRect(width / 2 - dlgW / 2, height / 2 - dlgH / 2, dlgW, dlgH, 12);

    this.add.text(width / 2, height / 2 - 58, '👑 Chọn Quân Phong Cấp', {
      fontFamily: "'Cinzel', serif", fontSize: '16px', fontStyle: 'bold', color: '#f0d9b5'
    }).setOrigin(0.5).setDepth(22);

    const allObjs = [overlay, dlg];
    const cleanup = () => {
      this.promotionPending = false;
      allObjs.forEach(o => o.destroy());
    };

    choices.forEach((type, i) => {
      const bx = width / 2 - 150 + i * 100;
      const by = height / 2 + 12;
      const bg = this.add.graphics().setDepth(22);
      const drawBg = (h) => {
        bg.clear();
        bg.fillStyle(h ? (isWhite ? 0x3355aa : 0x4a1a6a) : (isWhite ? 0x223344 : 0x2a1a3a), 1);
        bg.fillRoundedRect(bx - 38, by - 32, 76, 58, 8);
      };
      drawBg(false);

      const txt = this.add.text(bx, by - 5, labels[type], {
        fontFamily: "'Inter', sans-serif", fontSize: '13px',
        color: isWhite ? '#dde8f8' : '#c090ff', align: 'center'
      }).setOrigin(0.5).setDepth(23);

      const hitzone = this.add.rectangle(bx, by, 76, 58, 0x000000, 0)
        .setInteractive({ useHandCursor: true }).setDepth(24);
      hitzone.on('pointerover', () => drawBg(true));
      hitzone.on('pointerout', () => drawBg(false));
      hitzone.on('pointerdown', () => {
        cleanup();
        soundManager.playPromotion();
        this.performMove(move, type);
      });

      allObjs.push(bg, txt, hitzone);
    });
  }

  showGameEndDialog(reason, winner) {
    const { width, height } = this.scale;

    let title = '';
    let subtitle = '';
    if (reason === 'checkmate') {
      title = winner === Color.WHITE ? '🤍 Đội Trắng Thắng!' : '🖤 Đội Đen Thắng!';
      subtitle = 'Chiếu Bí!';
    } else if (reason === 'stalemate') {
      title = '🤝 Hòa Cờ!';
      subtitle = 'Bế Tắc — Không còn nước đi';
    } else if (reason === 'draw') {
      title = '🤝 Hòa Cờ!';
      subtitle = 'Luật 50 nước';
    } else if (reason === 'timeout') {
      title = winner === Color.WHITE ? '🤍 Đội Trắng Thắng!' : '🖤 Đội Đen Thắng!';
      subtitle = 'Hết Thời Gian!';
    }

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75).setDepth(30);
    const dlg = this.add.graphics().setDepth(31);
    dlg.fillStyle(0x150d28, 1);
    dlg.fillRoundedRect(width / 2 - 210, height / 2 - 130, 420, 260, 16);
    dlg.lineStyle(2, 0xc9a227, 1);
    dlg.strokeRoundedRect(width / 2 - 210, height / 2 - 130, 420, 260, 16);

    this.add.text(width / 2, height / 2 - 80, title, {
      fontFamily: "'Cinzel', serif", fontSize: '24px', fontStyle: 'bold',
      color: '#f0d9b5', align: 'center'
    }).setOrigin(0.5).setDepth(32);

    this.add.text(width / 2, height / 2 - 48, subtitle, {
      fontFamily: "'Inter', sans-serif", fontSize: '15px',
      color: 'rgba(200,190,255,0.9)'
    }).setOrigin(0.5).setDepth(32);

    const moveCount = this.gameState.moveHistory.length;
    const elapsed = Math.floor((Date.now() - this._gameStartTime) / 1000);
    const mins = Math.floor(elapsed / 60), secs = elapsed % 60;
    this.add.text(width / 2, height / 2 - 18, `${moveCount} nước · ${mins}:${secs.toString().padStart(2,'0')}`, {
      fontFamily: "'Inter', sans-serif", fontSize: '14px',
      color: 'rgba(200,190,255,0.7)'
    }).setOrigin(0.5).setDepth(32);

    // Buttons
    const createBtn = (cx, cy, label, color, onClick) => {
      const bg = this.add.graphics().setDepth(32);
      bg.fillStyle(color, 1); bg.fillRoundedRect(cx - 95, cy - 22, 190, 44, 8);
      this.add.text(cx, cy, label, {
        fontFamily: "'Inter', sans-serif", fontSize: '15px', fontStyle: 'bold', color: '#fff'
      }).setOrigin(0.5).setDepth(33);
      const hit = this.add.rectangle(cx, cy, 190, 44, 0, 0)
        .setInteractive({ useHandCursor: true }).setDepth(34);
      hit.on('pointerdown', onClick);
    };

    createBtn(width / 2 - 105, height / 2 + 50, '🔄 Ván Mới', 0x2a5a2a, () => {
      overlay.destroy(); dlg.destroy();
      this.handleNewGame();
    });
    createBtn(width / 2 + 105, height / 2 + 50, '🏠 Menu', 0x5a2a2a, () => this.handleMenu());

    // Stats
    const winRate = statsManager.getWinRate();
    const total = statsManager.get('totalGames');
    this.add.text(width / 2, height / 2 + 92, `Thắng: ${winRate}% | Tổng: ${total} ván`, {
      fontFamily: "'Inter', sans-serif", fontSize: '12px',
      color: 'rgba(180,170,220,0.7)'
    }).setOrigin(0.5).setDepth(32);
  }

  showHelpOverlay() {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85).setDepth(40);
    const helpLines = [
      '📖 HƯỚNG DẪN CHƠI',
      '',
      '• Click quân cờ để chọn',
      '• Chấm = ô có thể đi | Vòng = có thể ăn',
      '• Click ô đích để di chuyển',
      '• Ctrl+Z / Nút Hoàn Tác để lùi nước',
      '• Phím F để lật bàn cờ',
      '',
      '⚔ Luật đặc biệt:',
      '• Nhập thành: Vua đi 2 ô sang bên',
      '• Bắt tốt qua đường: Tốt bắt chéo',
      '• Phong cấp: Tốt đến hàng cuối',
      '',
      '🏆 Chiếu bí đối thủ để thắng!',
      '',
      '[Click bất kỳ để đóng]'
    ].join('\n');

    const txt = this.add.text(width / 2, height / 2, helpLines, {
      fontFamily: "'Inter', sans-serif", fontSize: '17px',
      color: '#f0e8d0', align: 'center', lineSpacing: 6
    }).setOrigin(0.5).setDepth(41);

    const close = () => { overlay.destroy(); txt.destroy(); };
    overlay.setInteractive().on('pointerdown', close);
    txt.setInteractive().on('pointerdown', close);
  }

  showAchievementsOverlay() {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.88).setDepth(40);
    const panel = this.add.graphics().setDepth(41);
    const pw = 520, ph = 460;
    panel.fillStyle(0x150d28, 1);
    panel.fillRoundedRect(width / 2 - pw / 2, height / 2 - ph / 2, pw, ph, 14);
    panel.lineStyle(2, 0xc9a227, 0.8);
    panel.strokeRoundedRect(width / 2 - pw / 2, height / 2 - ph / 2, pw, ph, 14);

    const progress = achievementsManager.getProgress();
    this.add.text(width / 2, height / 2 - ph / 2 + 25, `🎖️ Thành Tích (${progress.unlocked}/${progress.total})`, {
      fontFamily: "'Cinzel', serif", fontSize: '18px', fontStyle: 'bold', color: '#f0d9b5'
    }).setOrigin(0.5).setDepth(42);

    const allObjs = [overlay, panel];

    const unlocked = achievementsManager.getUnlocked();
    const locked = achievementsManager.getLocked();
    const all = [...unlocked, ...locked];

    all.slice(0, 12).forEach((a, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const ax = width / 2 - pw / 2 + 30 + col * 165;
      const ay = height / 2 - ph / 2 + 65 + row * 82;
      const isUnlocked = achievementsManager.isUnlocked(a.id);

      const bg = this.add.graphics().setDepth(42);
      bg.fillStyle(isUnlocked ? 0x2a1a4a : 0x1a1a2a, 0.9);
      bg.fillRoundedRect(ax, ay, 155, 70, 6);
      bg.lineStyle(1, isUnlocked ? 0x7c6af7 : 0x3a2a4a, 0.8);
      bg.strokeRoundedRect(ax, ay, 155, 70, 6);

      const iconTxt = this.add.text(ax + 12, ay + 12, a.icon, { fontSize: '22px' }).setDepth(43).setAlpha(isUnlocked ? 1 : 0.3);
      const nameTxt = this.add.text(ax + 40, ay + 10, a.name, {
        fontFamily: "'Inter', sans-serif", fontSize: '11px', fontStyle: 'bold',
        color: isUnlocked ? '#f0d9b5' : '#666', wordWrap: { width: 110 }
      }).setDepth(43);
      const descTxt = this.add.text(ax + 8, ay + 48, a.desc, {
        fontFamily: "'Inter', sans-serif", fontSize: '10px',
        color: isUnlocked ? 'rgba(200,190,255,0.8)' : '#444', wordWrap: { width: 140 }
      }).setDepth(43);

      allObjs.push(bg, iconTxt, nameTxt, descTxt);
    });

    // Close button
    const closeBtn = this.add.text(width / 2 + pw / 2 - 15, height / 2 - ph / 2 + 15, '✕', {
      fontSize: '18px', color: '#c9a227'
    }).setOrigin(0.5).setDepth(43).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => allObjs.forEach(o => o.destroy()));
    allObjs.push(closeBtn);
  }

  // ============================================================
  // ACHIEVEMENTS CHECK
  // ============================================================
  checkAchievements() {
    const stats = statsManager.getAll();
    const newOnes = achievementsManager.checkAll(stats);
    newOnes.forEach((a, i) => {
      this.time.delayedCall(i * 1000, () => this.showAchievementToast(a));
    });
  }

  showAchievementToast(achievement) {
    const { width } = this.scale;
    const toastW = 320, toastH = 56;
    const tx = width / 2 - toastW / 2;
    const ty = -toastH - 10;

    const bg = this.add.graphics().setDepth(50);
    bg.fillStyle(0x2a1a4a, 0.98);
    bg.fillRoundedRect(tx, ty, toastW, toastH, 8);
    bg.lineStyle(2, 0xc9a227, 1);
    bg.strokeRoundedRect(tx, ty, toastW, toastH, 8);

    const icon = this.add.text(tx + 14, ty + toastH / 2, achievement.icon, { fontSize: '22px' })
      .setOrigin(0, 0.5).setDepth(51);
    const title = this.add.text(tx + 48, ty + toastH / 2 - 9, '🎖️ Thành tích mở khóa!', {
      fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#c9a227'
    }).setDepth(51);
    const name = this.add.text(tx + 48, ty + toastH / 2 + 5, achievement.name, {
      fontFamily: "'Inter', sans-serif", fontSize: '13px', fontStyle: 'bold', color: '#f0d9b5'
    }).setDepth(51);

    const allToast = [bg, icon, title, name];

    // Slide in
    this.tweens.add({
      targets: allToast,
      y: `+=${toastH + 20}`,
      duration: 400, ease: 'Back.Out',
      onComplete: () => {
        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: allToast, alpha: 0, y: `-=30`,
            duration: 300, ease: 'Power2',
            onComplete: () => allToast.forEach(o => o.destroy())
          });
        });
      }
    });
  }

  // ============================================================
  // ACTIONS
  // ============================================================
  handleUndo() {
    if (this.isAnimating || this.aiThinking || this.gameOver) return;
    if (this.gameState.moveHistory.length === 0) return;

    // If playing vs AI, undo 2 moves (player + AI)
    let newState = undoMove(this.gameState);
    if (this.mode === 'ai' && newState.moveHistory.length > 0) {
      if (newState.turn === this.ai.color) newState = undoMove(newState);
    }

    soundManager.playUndo();
    this.gameState = newState;
    this.gameOver = false;
    this.clearSelection();
    this.refreshAllSprites();
    this.drawHighlights();
    this.updateSidebar();
    SaveManager.saveToLocal(this.gameState, { mode: this.mode });
  }

  handleNewGame() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Start new game via scene restart
      this.scene.restart({ mode: this.mode, aiDifficulty: this.aiDifficulty, aiColor: this.aiColor, timerMode: this.timerMode });
    });
  }

  flipBoard() {
    this.isFlipped = !this.isFlipped;
    this.drawTiles();
    this.refreshAllSprites();
    this.drawHighlights();
  }

  handleMenu() {
    SaveManager.saveToLocal(this.gameState, { mode: this.mode });
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }

  async handleSave() {
    const gameData = SaveManager.serializeGameState(this.gameState, { mode: this.mode, timerMode: this.timerMode });
    if (window.electronAPI) {
      const result = await window.electronAPI.saveGame(gameData);
      if (result.success) {
        this.showToast('💾 Đã lưu game!', '#4a9a4a');
      }
    } else {
      SaveManager.saveToLocal(this.gameState, { mode: this.mode });
      this.showToast('💾 Đã lưu game!', '#4a9a4a');
    }
  }

  async handleLoad() {
    if (window.electronAPI) {
      const result = await window.electronAPI.loadGame();
      if (result.success) {
        const loaded = SaveManager.deserializeGameState(result.data);
        if (loaded) {
          this.gameState = loaded;
          this.gameOver = false;
          this.clearSelection();
          this.refreshAllSprites();
          this.drawHighlights();
          this.updateSidebar();
          this.showToast('📂 Đã tải game!', '#4a7a9a');
        }
      }
    }
  }

  showToast(msg, color = '#c9a227') {
    const { width } = this.scale;
    const txt = this.add.text(width / 2, 30, msg, {
      fontFamily: "'Inter', sans-serif", fontSize: '14px', fontStyle: 'bold',
      color, backgroundColor: '#150d28', padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setDepth(50);

    this.tweens.add({
      targets: txt, alpha: 0, y: 10,
      delay: 2000, duration: 400, ease: 'Power2',
      onComplete: () => txt.destroy()
    });
  }

  // ============================================================
  // COORDINATE HELPERS
  // ============================================================
  cellToWorld(displayRow, displayCol) {
    return {
      x: this.boardOriginX + displayCol * TILE + TILE / 2,
      y: this.boardOriginY + displayRow * TILE + TILE / 2
    };
  }

  worldToCell(wx, wy) {
    const ox = this.boardOriginX, oy = this.boardOriginY;
    const col = Math.floor((wx - ox) / TILE);
    const row = Math.floor((wy - oy) / TILE);
    if (col < 0 || col >= 8 || row < 0 || row >= 8) return null;
    return { row, col };
  }
}
