// ============================================================
// ChessAI.js — Chess AI Engine with Minimax + Alpha-Beta
// Supports Easy (depth 2), Medium (depth 4), Hard (depth 6)
// ============================================================

import { getLegalMoves, makeMove, isInCheck, getAllLegalMovesForColor, Color, PieceType, GameStatus } from './ChessLogic.js';

// ============================================================
// Piece Square Tables (PST) — Positional evaluation
// ============================================================
const PST = {
  [PieceType.PAWN]: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
  ],
  [PieceType.KNIGHT]: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
  ],
  [PieceType.BISHOP]: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
  ],
  [PieceType.ROOK]: [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     0,  0,  0,  5,  5,  0,  0,  0
  ],
  [PieceType.QUEEN]: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
  ],
  [PieceType.KING]: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20
  ]
};

// King endgame PST
const KING_ENDGAME_PST = [
  -50,-40,-30,-20,-20,-30,-40,-50,
  -30,-20,-10,  0,  0,-10,-20,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-30,  0,  0,  0,  0,-30,-30,
  -50,-30,-30,-30,-30,-30,-30,-50
];

// Piece material values
const PIECE_VALUES = {
  [PieceType.PAWN]:   100,
  [PieceType.KNIGHT]: 320,
  [PieceType.BISHOP]: 330,
  [PieceType.ROOK]:   500,
  [PieceType.QUEEN]:  900,
  [PieceType.KING]:   20000
};

// Opening book — first moves (from, to) encoded as "r1c1-r2c2"
const OPENING_BOOK = {
  // Empty board (first move) — e4, d4, Nf3 openings
  '': ['6,4-4,4', '6,3-4,3', '7,6-5,5', '6,2-4,2', '6,4-5,4'],
  // After 1.e4
  '6,4-4,4': ['1,4-3,4', '1,2-3,2', '1,4-2,4', '0,6-2,5'],
  // After 1.d4
  '6,3-4,3': ['1,3-3,3', '1,6-2,5', '1,2-3,2'],
};

// ============================================================
// Evaluation Function
// ============================================================
function isEndgame(board) {
  let queens = 0, minors = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (p.type === PieceType.QUEEN) queens++;
      if (p.type === PieceType.KNIGHT || p.type === PieceType.BISHOP) minors++;
    }
  return queens === 0 || (queens === 2 && minors <= 2);
}

function getPSTValue(piece, row, col) {
  const isWhite = piece.color === Color.WHITE;
  const pstRow = isWhite ? row : (7 - row);
  const pst = (piece.type === PieceType.KING) ? null : PST[piece.type];
  if (!pst) return 0;
  return pst[pstRow * 8 + col];
}

function evaluateBoard(gameState) {
  const { board, status, turn } = gameState;
  
  // Terminal states
  if (status === GameStatus.CHECKMATE) {
    return turn === Color.WHITE ? -50000 : 50000;
  }
  if (status === GameStatus.STALEMATE || status === GameStatus.DRAW) {
    return 0;
  }

  const endgame = isEndgame(board);
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const isWhite = piece.color === Color.WHITE;
      const sign = isWhite ? 1 : -1;

      // Material value
      let value = PIECE_VALUES[piece.type] || 0;

      // Piece-square table bonus
      if (piece.type === PieceType.KING && endgame) {
        const pstRow = isWhite ? r : (7 - r);
        value += KING_ENDGAME_PST[pstRow * 8 + c];
      } else {
        value += getPSTValue(piece, r, c);
      }

      score += sign * value;
    }
  }

  // Check penalty for the side being checked
  if (status === GameStatus.CHECK) {
    score += (turn === Color.WHITE) ? -50 : 50;
  }

  return score;
}

// ============================================================
// Move Ordering — better moves first for better pruning
// ============================================================
function orderMoves(gameState, moves) {
  return moves.sort((a, b) => {
    let scoreA = 0, scoreB = 0;
    const { board } = gameState;

    // Prioritize captures (MVV-LVA: Most Valuable Victim - Least Valuable Attacker)
    const captureA = board[a.to.row]?.[a.to.col];
    const captureB = board[b.to.row]?.[b.to.col];
    const pieceA = board[a.from.row]?.[a.from.col];
    const pieceB = board[b.from.row]?.[b.from.col];

    if (captureA) scoreA += (PIECE_VALUES[captureA.type] || 0) - (PIECE_VALUES[pieceA?.type] || 0) / 10;
    if (captureB) scoreB += (PIECE_VALUES[captureB.type] || 0) - (PIECE_VALUES[pieceB?.type] || 0) / 10;

    // Promotions
    if (a.flags?.includes('promotion')) scoreA += 800;
    if (b.flags?.includes('promotion')) scoreB += 800;

    // Castling
    if (a.flags?.includes('castleKing') || a.flags?.includes('castleQueen')) scoreA += 60;
    if (b.flags?.includes('castleKing') || b.flags?.includes('castleQueen')) scoreB += 60;

    return scoreB - scoreA;
  });
}

// ============================================================
// Minimax with Alpha-Beta Pruning
// ============================================================
function minimax(gameState, depth, alpha, beta, maximizing, startTime, timeLimit) {
  // Time limit check
  if (Date.now() - startTime > timeLimit) {
    return { score: evaluateBoard(gameState), move: null, timeout: true };
  }

  const { status, turn } = gameState;

  // Terminal / leaf node
  if (depth === 0 || status === GameStatus.CHECKMATE || status === GameStatus.STALEMATE || status === GameStatus.DRAW) {
    return { score: evaluateBoard(gameState), move: null };
  }

  // Gather all legal moves for current turn
  const allMoves = getAllLegalMovesForColor(gameState, turn);
  const orderedMoves = orderMoves(gameState, allMoves);

  if (orderedMoves.length === 0) {
    return { score: evaluateBoard(gameState), move: null };
  }

  let bestMove = orderedMoves[0];

  if (maximizing) {
    let maxScore = -Infinity;
    for (const move of orderedMoves) {
      const nextState = makeMove(gameState, move);
      const result = minimax(nextState, depth - 1, alpha, beta, false, startTime, timeLimit);
      if (result.timeout) return { score: maxScore, move: bestMove, timeout: true };
      if (result.score > maxScore) {
        maxScore = result.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, maxScore);
      if (beta <= alpha) break; // Alpha-Beta cutoff
    }
    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;
    for (const move of orderedMoves) {
      const nextState = makeMove(gameState, move);
      const result = minimax(nextState, depth - 1, alpha, beta, true, startTime, timeLimit);
      if (result.timeout) return { score: minScore, move: bestMove, timeout: true };
      if (result.score < minScore) {
        minScore = result.score;
        bestMove = move;
      }
      beta = Math.min(beta, minScore);
      if (beta <= alpha) break; // Alpha-Beta cutoff
    }
    return { score: minScore, move: bestMove };
  }
}

// ============================================================
// Iterative Deepening — use time budget effectively
// ============================================================
function iterativeDeepening(gameState, maxDepth, timeLimit = 3000) {
  const startTime = Date.now();
  let bestMove = null;
  const isMaximizing = gameState.turn === Color.WHITE;

  for (let depth = 1; depth <= maxDepth; depth++) {
    const result = minimax(gameState, depth, -Infinity, Infinity, isMaximizing, startTime, timeLimit);
    if (result.move) bestMove = result.move;
    if (result.timeout || Date.now() - startTime > timeLimit * 0.9) break;
  }
  return bestMove;
}

// ============================================================
// Opening Book Lookup
// ============================================================
function getOpeningMove(gameState) {
  if (gameState.moveHistory.length > 8) return null; // out of book
  
  const key = gameState.moveHistory.map(m => `${m.from.row},${m.from.col}-${m.to.row},${m.to.col}`).join('|');
  
  // Try last move as key
  const lastMoveKey = gameState.moveHistory.length > 0 
    ? `${gameState.moveHistory[gameState.moveHistory.length-1].from.row},${gameState.moveHistory[gameState.moveHistory.length-1].from.col}-${gameState.moveHistory[gameState.moveHistory.length-1].to.row},${gameState.moveHistory[gameState.moveHistory.length-1].to.col}`
    : '';
  
  const candidates = OPENING_BOOK[lastMoveKey];
  if (!candidates || candidates.length === 0) return null;

  // Pick random opening move from candidates
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const [from, to] = chosen.split('-').map(s => {
    const [r, c] = s.split(',').map(Number);
    return { row: r, col: c };
  });

  // Find the matching legal move
  const allMoves = getAllLegalMovesForColor(gameState, gameState.turn);
  return allMoves.find(m => m.from.row === from.row && m.from.col === from.col && m.to.row === to.row && m.to.col === to.col) || null;
}

// ============================================================
// Difficulty Configurations
// ============================================================
export const AIDifficulty = {
  EASY:   { depth: 2, timeLimit: 500,  randomness: 0.3, name: 'Dễ' },
  MEDIUM: { depth: 4, timeLimit: 2000, randomness: 0.05, name: 'Trung Bình' },
  HARD:   { depth: 6, timeLimit: 4000, randomness: 0,   name: 'Khó' }
};

// ============================================================
// Main AI Entry Point
// ============================================================
export class ChessAI {
  constructor(difficulty = 'MEDIUM') {
    this.difficulty = AIDifficulty[difficulty] || AIDifficulty.MEDIUM;
    this.color = Color.BLACK; // AI plays black by default
  }

  setDifficulty(level) {
    this.difficulty = AIDifficulty[level] || AIDifficulty.MEDIUM;
  }

  setColor(color) {
    this.color = color;
  }

  /**
   * Get the best move for the AI
   * @param {Object} gameState - Current game state
   * @returns {Object|null} - Best move object
   */
  getBestMove(gameState) {
    const { depth, timeLimit, randomness } = this.difficulty;

    // Try opening book first
    const bookMove = getOpeningMove(gameState);
    if (bookMove && Math.random() > 0.15) return bookMove;

    // Get all legal moves
    const allMoves = getAllLegalMovesForColor(gameState, gameState.turn);
    if (allMoves.length === 0) return null;
    if (allMoves.length === 1) return allMoves[0];

    // Easy mode: occasional random move
    if (randomness > 0 && Math.random() < randomness) {
      return allMoves[Math.floor(Math.random() * allMoves.length)];
    }

    // Use iterative deepening minimax
    return iterativeDeepening(gameState, depth, timeLimit);
  }

  /**
   * Async wrapper — returns move via Promise (non-blocking)
   */
  getBestMoveAsync(gameState) {
    return new Promise(resolve => {
      // Small timeout to let UI update before computing
      setTimeout(() => {
        const move = this.getBestMove(gameState);
        resolve(move);
      }, 50);
    });
  }
}
