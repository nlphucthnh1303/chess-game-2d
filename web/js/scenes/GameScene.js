// ============================================================
// GameScene.js — Main gameplay scene (PvP)
// ============================================================
import {
  createGameState, getLegalMoves, makeMove, undoMove,
  GameStatus, Color, PieceType
} from '../chess/ChessLogic.js';
import { SpriteUtils } from '../utils/SpriteUtils.js';

// Board visual constants
const TILE = 80;            // px per tile
const BOARD_COLS = 8;
const BOARD_ROWS = 8;
const BOARD_W = TILE * BOARD_COLS;
const BOARD_H = TILE * BOARD_ROWS;
const FRAME = 40;           // frame around board
const SIDEBAR_W = 260;

const COL_LETTERS = 'abcdefgh';

// Colors
const C = {
  LIGHT: 0xf0d9b5,
  DARK:  0xb58863,
  FRAME: 0x7a4f1e,
  FRAME_INNER: 0x9a6a30,
  GOLD:  0xc9a227,
  HIGHLIGHT_SELECTED: 0xf6f669,
  HIGHLIGHT_LEGAL:    0xcdd16e,
  HIGHLIGHT_LAST:     0xffd700,
  HIGHLIGHT_CHECK:    0xff4444,
  DOT:   0x2d2d2d,
  SIDEBAR_BG: 0x120d24,
  SIDEBAR_BORDER: 0x3a2a5a,
  WHITE_TEAM: 0xdde8f8,
  BLACK_TEAM: 0x6644aa,
  TEXT_GOLD:  0xf0d9b5,
  TEXT_LIGHT: 0xcccccc
};

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.mode = data?.mode || 'pvp';
  }

  create() {
    const { width, height } = this.scale;

    // Layout calculations
    this.boardOriginX = FRAME + 24;
    this.boardOriginY = (height - BOARD_H) / 2;

    // Game state
    this.gameState = createGameState();
    this.selectedCell = null;
    this.legalMoves = [];
    this.isAnimating = false;
    this.promotionPending = null;

    this.createBackground(width, height);
    this.createBoardGraphics();
    this.createSidebar(width, height);
    this.createPieceSprites();
    this.createHighlightLayers();
    this.createInputHandlers();
    this.updateSidebar();
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

    // Outer glow
    const glow = this.add.graphics();
    glow.fillStyle(0x7c6af7, 0.07);
    glow.fillRoundedRect(ox - FRAME - 8, oy - FRAME - 8, BOARD_W + (FRAME + 8) * 2, BOARD_H + (FRAME + 8) * 2, 16);

    // Wooden frame
    const frame = this.add.graphics();
    frame.fillStyle(C.FRAME, 1);
    frame.fillRoundedRect(ox - FRAME, oy - FRAME, BOARD_W + FRAME * 2, BOARD_H + FRAME * 2, 8);
    frame.fillStyle(C.FRAME_INNER, 1);
    frame.fillRoundedRect(ox - FRAME + 4, oy - FRAME + 4, BOARD_W + FRAME * 2 - 8, BOARD_H + FRAME * 2 - 8, 6);
    frame.lineStyle(1.5, C.GOLD, 0.8);
    frame.strokeRoundedRect(ox - FRAME, oy - FRAME, BOARD_W + FRAME * 2, BOARD_H + FRAME * 2, 8);

    // Tiles
    this.boardTiles = this.add.graphics();
    this.drawTiles();

    // Coord labels
    this.createCoordLabels(ox, oy);
  }

  drawTiles() {
    const g = this.boardTiles;
    g.clear();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        g.fillStyle((r + c) % 2 === 0 ? C.LIGHT : C.DARK, 1);
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
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#c9a227'
    };

    for (let i = 0; i < 8; i++) {
      // Columns (a-h) bottom + top
      const letter = COL_LETTERS[i];
      const lx = ox + i * TILE + TILE / 2;
      this.add.text(lx, oy + BOARD_H + 10, letter, style).setOrigin(0.5, 0);
      this.add.text(lx, oy - 22, letter, style).setOrigin(0.5, 1);

      // Rows (8-1) left + right
      const num = String(8 - i);
      const ly = oy + i * TILE + TILE / 2;
      this.add.text(ox - 15, ly, num, style).setOrigin(1, 0.5);
      this.add.text(ox + BOARD_W + 15, ly, num, style).setOrigin(0, 0.5);
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

    // Last move highlight
    if (moveHistory.length > 0) {
      const last = moveHistory[moveHistory.length - 1];
      g.fillStyle(C.HIGHLIGHT_LAST, 0.35);
      g.fillRect(ox + last.from.col * TILE, oy + last.from.row * TILE, TILE, TILE);
      g.fillRect(ox + last.to.col * TILE, oy + last.to.row * TILE, TILE, TILE);
    }

    // Check highlight — king in check
    if (status === GameStatus.CHECK || status === GameStatus.CHECKMATE) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p?.type === PieceType.KING && p?.color === turn) {
            // Pulsing red (we'll use a static red, Phaser tween handles pulse)
            g.fillStyle(C.HIGHLIGHT_CHECK, 0.6);
            g.fillRect(ox + c * TILE, oy + r * TILE, TILE, TILE);
          }
        }
      }
    }

    // Selected cell
    if (this.selectedCell) {
      const { row, col } = this.selectedCell;
      g.fillStyle(C.HIGHLIGHT_SELECTED, 0.5);
      g.fillRect(ox + col * TILE, oy + row * TILE, TILE, TILE);

      // Legal moves
      this.legalMoves.forEach(m => {
        const tr = m.to.row, tc = m.to.col;
        const hasEnemy = !!board[tr][tc];

        if (hasEnemy || m.flags?.includes('enPassant')) {
          // Ring on enemy square
          d.lineStyle(5, 0x333333, 0.7);
          d.strokeCircle(
            ox + tc * TILE + TILE / 2,
            oy + tr * TILE + TILE / 2,
            TILE / 2 - 3
          );
        } else {
          // Dot on empty square
          d.fillStyle(C.DOT, 0.35);
          d.fillCircle(
            ox + tc * TILE + TILE / 2,
            oy + tr * TILE + TILE / 2,
            TILE / 6
          );
        }
      });
    }
  }

  // ============================================================
  // PIECE SPRITES
  // ============================================================
  createPieceSprites() {
    this.pieceSprites = {};
    const { board } = this.gameState;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) this.spawnSprite(r, c, piece);
      }
    }
  }

  spawnSprite(row, col, piece) {
    const key = `${row},${col}`;
    const textureKey = SpriteUtils.getKey(piece.color, piece.type);
    const { x, y } = this.cellToWorld(row, col);

    let sprite;
    if (this.textures.exists(textureKey)) {
      sprite = this.add.image(x, y, textureKey);
      const tileScale = (TILE * 0.88) / Math.max(sprite.width, sprite.height);
      sprite.setScale(tileScale);
    } else {
      // Fallback: colored circle with piece letter
      sprite = this.createFallbackPiece(x, y, piece);
    }

    sprite.setDepth(2);

    // Idle bob animation
    this.tweens.add({
      targets: sprite,
      y: y - 4,
      duration: 1200 + Math.random() * 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: Math.random() * 1000
    });

    this.pieceSprites[key] = sprite;
    return sprite;
  }

  createFallbackPiece(x, y, piece) {
    const container = this.add.container(x, y);
    const isWhite = piece.color === Color.WHITE;
    const typeLabels = { P: '♟', R: '♜', N: '♞', B: '♝', Q: '♛', K: '♚' };

    // Shadow
    const shadow = this.add.ellipse(0, 22, 50, 12, 0x000000, 0.3);
    // Body circle
    const body = this.add.circle(0, 0, 30,
      isWhite ? 0xdde8f8 : 0x221133, 1
    ).setStrokeStyle(2, isWhite ? 0x9bb5cc : 0x6644aa);
    // Piece symbol
    const label = this.add.text(0, 0, typeLabels[piece.type] || '?', {
      fontSize: '24px',
      color: isWhite ? '#334466' : '#c090ff'
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

    const { x, y } = this.cellToWorld(toRow, toCol);
    sprite.setDepth(5); // above other pieces during move

    this.tweens.add({
      targets: sprite,
      x, y,
      duration: 320,
      ease: 'Back.Out',
      onComplete: () => {
        sprite.setDepth(2);
        const toKey = `${toRow},${toCol}`;
        this.pieceSprites[toKey] = sprite;

        // Resume idle bob
        this.tweens.add({
          targets: sprite,
          y: y - 4,
          duration: 1200 + Math.random() * 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        // Dust particles
        this.spawnDustParticles(x, y);
        onComplete?.();
      }
    });
  }

  spawnDustParticles(x, y) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 20;
      const px = x + Math.cos(angle) * radius;
      const py = y + 20 + Math.sin(angle) * radius * 0.4;

      let dot;
      if (this.textures.exists('particle')) {
        dot = this.add.image(px, py, 'particle').setScale(0.4).setAlpha(0.7).setDepth(6);
      } else {
        dot = this.add.circle(px, py, 3, 0xffffff, 0.6).setDepth(6);
      }

      this.tweens.add({
        targets: dot,
        x: px + Math.cos(angle) * 15,
        y: py - 10,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => dot.destroy()
      });
    }
  }

  refreshAllSprites() {
    // Destroy all current sprites
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

    // Background panel
    const panel = this.add.graphics();
    panel.fillStyle(C.SIDEBAR_BG, 0.92);
    panel.fillRoundedRect(sx, sy, sw, sh, 12);
    panel.lineStyle(1, C.SIDEBAR_BORDER, 1);
    panel.strokeRoundedRect(sx, sy, sw, sh, 12);

    this.sidebarX = sx;
    this.sidebarY = sy;
    this.sidebarW = sw;
    this.sidebarH = sh;

    // Create dynamic text objects
    const pad = 16;
    const cx = sx + sw / 2;

    // === Player banners ===
    this.createPlayerBanner(cx, sy + pad + 30, Color.BLACK, '🖤 Đội Đen');
    this.createPlayerBanner(cx, sy + sh - pad - 30, Color.WHITE, '🤍 Đội Trắng');

    // === Turn indicator ===
    this.turnBg = this.add.graphics();
    this.turnText = this.add.text(cx, sy + sh / 2 - 60, '', {
      fontFamily: "'Cinzel', serif",
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#f0d9b5',
      align: 'center'
    }).setOrigin(0.5).setDepth(3);

    // === Status text ===
    this.statusText = this.add.text(cx, sy + sh / 2 - 30, '', {
      fontFamily: "'Inter', sans-serif",
      fontSize: '14px',
      color: '#ff8888',
      align: 'center'
    }).setOrigin(0.5).setDepth(3);

    // === Move counter ===
    this.moveCountText = this.add.text(cx, sy + sh / 2, '', {
      fontFamily: "'Inter', sans-serif",
      fontSize: '13px',
      color: 'rgba(200,190,255,0.7)',
      align: 'center'
    }).setOrigin(0.5).setDepth(3);

    // === Last move ===
    this.lastMoveLabel = this.add.text(sx + pad, sy + sh / 2 + 24, 'Nước cuối:', {
      fontFamily: "'Inter', sans-serif",
      fontSize: '12px',
      color: 'rgba(180,170,220,0.7)'
    }).setDepth(3);
    this.lastMoveText = this.add.text(cx, sy + sh / 2 + 42, '—', {
      fontFamily: "'Cinzel', serif",
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#c9a227',
      align: 'center'
    }).setOrigin(0.5).setDepth(3);

    // === Captured pieces ===
    this.capturedWhiteLabel = this.add.text(sx + pad, sy + sh / 2 + 70, '⚔ Đội Trắng bắt:', {
      fontFamily: "'Inter', sans-serif",
      fontSize: '12px',
      color: 'rgba(200,190,255,0.6)'
    }).setDepth(3);
    this.capturedWhiteText = this.add.text(sx + pad, sy + sh / 2 + 88, '', {
      fontFamily: "'Inter', sans-serif",
      fontSize: '12px',
      color: '#dde8f8'
    }).setDepth(3);
    this.capturedBlackLabel = this.add.text(sx + pad, sy + sh / 2 + 108, '⚔ Đội Đen bắt:', {
      fontFamily: "'Inter', sans-serif",
      fontSize: '12px',
      color: 'rgba(200,190,255,0.6)'
    }).setDepth(3);
    this.capturedBlackText = this.add.text(sx + pad, sy + sh / 2 + 126, '', {
      fontFamily: "'Inter', sans-serif",
      fontSize: '12px',
      color: '#c090ff'
    }).setDepth(3);

    // === Buttons ===
    this.createSidebarButton(cx, sy + sh - 100, '↩  Hoàn Tác', 0x2a1a4a, 0x5040a0, () => this.handleUndo());
    this.createSidebarButton(cx, sy + sh - 54, '🔄  Ván Mới', 0x1a2a1a, 0x2a5a2a, () => this.handleNewGame());
    this.createSidebarButton(cx, sy + sh - 148, '🏠  Menu', 0x2a1a1a, 0x5a2a2a, () => this.handleMenu());
  }

  createPlayerBanner(cx, cy, color, label) {
    const isWhite = color === Color.WHITE;
    const bg = this.add.graphics();
    bg.fillStyle(isWhite ? 0x1a2a3a : 0x2a1a3a, 0.8);
    bg.fillRoundedRect(cx - 100, cy - 24, 200, 40, 8);
    bg.lineStyle(1, isWhite ? 0x4a6a9a : 0x6a3a9a, 0.6);
    bg.strokeRoundedRect(cx - 100, cy - 24, 200, 40, 8);

    this.add.text(cx, cy, label, {
      fontFamily: "'Cinzel', serif",
      fontSize: '14px',
      fontStyle: 'bold',
      color: isWhite ? '#dde8f8' : '#c090ff',
      align: 'center'
    }).setOrigin(0.5).setDepth(3);
  }

  createSidebarButton(cx, cy, label, color, hoverColor, onClick) {
    const w = 200, h = 36;
    const bg = this.add.graphics();
    const drawBg = (hovered) => {
      bg.clear();
      bg.fillStyle(hovered ? hoverColor : color, 1);
      bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
      bg.lineStyle(1, 0x4a3a6a, 0.7);
      bg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
    };
    drawBg(false);

    const txt = this.add.text(cx, cy, label, {
      fontFamily: "'Inter', sans-serif",
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(3);

    // Hitzone
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

    // Turn indicator
    const isWhite = turn === Color.WHITE;
    this.turnBg.clear();
    this.turnBg.fillStyle(isWhite ? 0x223344 : 0x2a1a3a, 0.9);
    this.turnBg.fillRoundedRect(
      this.sidebarX + 8, this.sidebarY + this.sidebarH / 2 - 72,
      this.sidebarW - 16, 24, 6
    );
    this.turnText
      .setText(isWhite ? '🤍 Lượt: Đội Trắng' : '🖤 Lượt: Đội Đen')
      .setColor(isWhite ? '#dde8f8' : '#c090ff');

    // Status
    const statusMessages = {
      [GameStatus.ACTIVE]: '',
      [GameStatus.CHECK]: '⚠ Đang Bị Chiếu!',
      [GameStatus.CHECKMATE]: isWhite ? '💀 Đội Đen Thắng!' : '🏆 Đội Trắng Thắng!',
      [GameStatus.STALEMATE]: '🤝 Hòa — Bế Tắc!',
      [GameStatus.DRAW]: '🤝 Hòa!'
    };
    this.statusText.setText(statusMessages[status] || '');

    // Move count
    this.moveCountText.setText(`Nước thứ: ${fullMoveNumber}`);

    // Last move
    const lastEntry = moveHistory[moveHistory.length - 1];
    this.lastMoveText.setText(lastEntry?.notation || '—');

    // Captured
    const pieceSymbols = { P: '♟', R: '♜', N: '♞', B: '♝', Q: '♛', K: '♚' };
    const whiteCap = capturedPieces[Color.WHITE].map(p => pieceSymbols[p.type]).join(' ');
    const blackCap = capturedPieces[Color.BLACK].map(p => pieceSymbols[p.type]).join(' ');
    this.capturedWhiteText.setText(whiteCap || '—');
    this.capturedBlackText.setText(blackCap || '—');
  }

  // ============================================================
  // INPUT HANDLING
  // ============================================================
  createInputHandlers() {
    const { width, height } = this.scale;

    // Click on board area
    this.input.on('pointerdown', (pointer) => {
      if (this.isAnimating) return;
      if (this.promotionPending) return;

      const cell = this.worldToCell(pointer.x, pointer.y);
      if (!cell) {
        this.clearSelection();
        return;
      }
      this.handleCellClick(cell.row, cell.col);
    });
  }

  handleCellClick(row, col) {
    const { gameState, selectedCell, legalMoves } = this;
    const { board, turn, status } = gameState;

    if (status === GameStatus.CHECKMATE || status === GameStatus.STALEMATE ||
        status === GameStatus.DRAW) return;

    // If a cell is already selected
    if (selectedCell) {
      // Check if clicking a valid legal move target
      const matchingMove = legalMoves.find(m => m.to.row === row && m.to.col === col);
      if (matchingMove) {
        this.executeMove(matchingMove);
        return;
      }
    }

    // Select a new piece
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
    this.tweens.add({
      targets: sprite,
      scaleX: sprite.scaleX * 1.15,
      scaleY: sprite.scaleY * 1.15,
      duration: 150,
      yoyo: true,
      ease: 'Back.Out'
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
    const { from, to, flags = [] } = move;
    const piece = this.gameState.board[from.row][from.col];
    this.isAnimating = true;
    this.clearSelection();

    // Handle promotion
    if (flags.includes('promotion')) {
      this.showPromotionDialog(move, piece.color);
      return;
    }

    this.performMove(move, PieceType.QUEEN);
  }

  performMove(move, promotionType) {
    const { from, to, flags = [] } = move;

    // Capture animation — destroy captured sprite first
    if (this.gameState.board[to.row][to.col]) {
      this.animateCapture(to.row, to.col);
    }
    // En passant capture
    if (flags.includes('enPassant')) {
      const capRow = from.row;
      this.animateCapture(capRow, to.col);
    }

    // Castling — also move rook
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
      // Update game state
      this.gameState = makeMove(this.gameState, move, promotionType);

      // If promotion, refresh the sprite with new piece type
      if (flags.includes('promotion')) {
        this.destroySprite(to.row, to.col);
        const newPiece = this.gameState.board[to.row][to.col];
        this.spawnSprite(to.row, to.col, newPiece);
      }

      this.isAnimating = false;
      this.drawHighlights();
      this.updateSidebar();
      this.checkGameEnd();
    });
  }

  animateCapture(row, col) {
    const key = `${row},${col}`;
    const sprite = this.pieceSprites[key];
    if (!sprite) return;

    this.tweens.killTweensOf(sprite);
    this.tweens.add({
      targets: sprite,
      scaleX: 0, scaleY: 0,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        sprite.destroy();
        delete this.pieceSprites[key];
      }
    });
  }

  checkGameEnd() {
    const { status } = this.gameState;
    if (status === GameStatus.CHECKMATE || status === GameStatus.STALEMATE ||
        status === GameStatus.DRAW) {
      this.time.delayedCall(600, () => this.showGameEndDialog());
    } else if (status === GameStatus.CHECK) {
      this.flashCheckIndicator();
    }
  }

  flashCheckIndicator() {
    const g = this.add.graphics().setDepth(10);
    const { width, height } = this.scale;
    let count = 0;
    const flash = () => {
      g.clear();
      if (count % 2 === 0) {
        g.lineStyle(4, 0xff4444, 0.8);
        g.strokeRect(0, 0, width, height);
      }
      count++;
      if (count < 6) this.time.delayedCall(200, flash);
      else g.destroy();
    };
    flash();
  }

  // ============================================================
  // PROMOTION DIALOG
  // ============================================================
  showPromotionDialog(move, color) {
    const { width, height } = this.scale;
    const isWhite = color === Color.WHITE;
    const choices = [PieceType.QUEEN, PieceType.ROOK, PieceType.BISHOP, PieceType.KNIGHT];
    const labels = { Q: '♛ Hậu', R: '♜ Xe', B: '♝ Tượng', N: '♞ Mã' };

    // Dim overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setDepth(20).setInteractive();

    // Dialog box
    const dlgW = 360, dlgH = 180;
    const dlg = this.add.graphics().setDepth(21);
    dlg.fillStyle(0x1a0a2e, 1);
    dlg.fillRoundedRect(width / 2 - dlgW / 2, height / 2 - dlgH / 2, dlgW, dlgH, 12);
    dlg.lineStyle(2, isWhite ? 0x4a6a9a : 0x6a3a9a, 1);
    dlg.strokeRoundedRect(width / 2 - dlgW / 2, height / 2 - dlgH / 2, dlgW, dlgH, 12);

    this.add.text(width / 2, height / 2 - 60, '👑 Chọn Quân Phong Cấp', {
      fontFamily: "'Cinzel', serif",
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#f0d9b5'
    }).setOrigin(0.5).setDepth(22);

    const cleanup = () => { overlay.destroy(); dlg.destroy(); allObjs.forEach(o => o.destroy()); };
    const allObjs = [];

    choices.forEach((type, i) => {
      const bx = width / 2 - 160 + i * 90;
      const by = height / 2 + 10;
      const bg = this.add.graphics().setDepth(22);
      bg.fillStyle(isWhite ? 0x223344 : 0x2a1a3a, 1);
      bg.fillRoundedRect(bx - 35, by - 30, 70, 55, 8);
      bg.lineStyle(1, isWhite ? 0x4488cc : 0x9944cc, 0.8);
      bg.strokeRoundedRect(bx - 35, by - 30, 70, 55, 8);

      const txt = this.add.text(bx, by - 5, labels[type], {
        fontFamily: "'Inter', sans-serif",
        fontSize: '13px',
        color: isWhite ? '#dde8f8' : '#c090ff',
        align: 'center'
      }).setOrigin(0.5).setDepth(23);

      const hitzone = this.add.rectangle(bx, by, 70, 55, 0x000000, 0)
        .setInteractive({ useHandCursor: true }).setDepth(24);
      hitzone.on('pointerover', () => { bg.clear(); bg.fillStyle(isWhite ? 0x3355aa : 0x4a1a6a, 1); bg.fillRoundedRect(bx - 35, by - 30, 70, 55, 8); });
      hitzone.on('pointerout', () => { bg.clear(); bg.fillStyle(isWhite ? 0x223344 : 0x2a1a3a, 1); bg.fillRoundedRect(bx - 35, by - 30, 70, 55, 8); });
      hitzone.on('pointerdown', () => {
        cleanup();
        this.performMove(move, type);
      });

      allObjs.push(bg, txt, hitzone);
    });
  }

  // ============================================================
  // GAME END DIALOG
  // ============================================================
  showGameEndDialog() {
    const { width, height } = this.scale;
    const { status, turn } = this.gameState;

    const messages = {
      [GameStatus.CHECKMATE]: turn === Color.WHITE ? '🖤 Đội Đen Chiến Thắng!' : '🤍 Đội Trắng Chiến Thắng!',
      [GameStatus.STALEMATE]: '🤝 Hòa — Bế Tắc!',
      [GameStatus.DRAW]: '🤝 Ván Cờ Hòa!'
    };

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75).setDepth(30);
    const dlg = this.add.graphics().setDepth(31);
    dlg.fillStyle(0x150d28, 1);
    dlg.fillRoundedRect(width / 2 - 200, height / 2 - 120, 400, 240, 16);
    dlg.lineStyle(2, 0xc9a227, 1);
    dlg.strokeRoundedRect(width / 2 - 200, height / 2 - 120, 400, 240, 16);

    this.add.text(width / 2, height / 2 - 70, messages[status] || 'Kết Thúc!', {
      fontFamily: "'Cinzel', serif",
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#f0d9b5',
      align: 'center'
    }).setOrigin(0.5).setDepth(32);

    const moveCount = this.gameState.moveHistory.length;
    this.add.text(width / 2, height / 2 - 30, `Tổng số nước: ${moveCount}`, {
      fontFamily: "'Inter', sans-serif",
      fontSize: '15px',
      color: 'rgba(200,190,255,0.8)'
    }).setOrigin(0.5).setDepth(32);

    // Buttons
    const createBtn = (cx, cy, label, color, onClick) => {
      const bg = this.add.graphics().setDepth(32);
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(cx - 90, cy - 20, 180, 40, 8);
      const txt = this.add.text(cx, cy, label, {
        fontFamily: "'Inter', sans-serif",
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#fff'
      }).setOrigin(0.5).setDepth(33);
      const hit = this.add.rectangle(cx, cy, 180, 40, 0, 0)
        .setInteractive({ useHandCursor: true }).setDepth(34);
      hit.on('pointerdown', onClick);
    };

    createBtn(width / 2 - 100, height / 2 + 50, '🔄 Ván Mới', 0x2a5a2a, () => {
      overlay.destroy(); dlg.destroy();
      this.handleNewGame();
    });
    createBtn(width / 2 + 100, height / 2 + 50, '🏠 Menu', 0x5a2a2a, () => {
      this.handleMenu();
    });
  }

  // ============================================================
  // ACTIONS
  // ============================================================
  handleUndo() {
    if (this.isAnimating) return;
    if (this.gameState.moveHistory.length === 0) return;

    this.gameState = undoMove(this.gameState);
    this.clearSelection();
    this.refreshAllSprites();
    this.drawHighlights();
    this.updateSidebar();
  }

  handleNewGame() {
    this.gameState = createGameState();
    this.clearSelection();
    this.isAnimating = false;
    this.refreshAllSprites();
    this.drawHighlights();
    this.updateSidebar();
  }

  handleMenu() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }

  // ============================================================
  // COORDINATE HELPERS
  // ============================================================
  cellToWorld(row, col) {
    return {
      x: this.boardOriginX + col * TILE + TILE / 2,
      y: this.boardOriginY + row * TILE + TILE / 2
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
