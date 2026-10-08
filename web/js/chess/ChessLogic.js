// ============================================================
// ChessLogic.js — Pure chess engine (no rendering)
// Quản lý toàn bộ luật cờ vua: nước đi hợp lệ, chiếu, chiếu bí
// ============================================================

export const PieceType = {
  PAWN: 'P', ROOK: 'R', KNIGHT: 'N',
  BISHOP: 'B', QUEEN: 'Q', KING: 'K'
};

export const Color = { WHITE: 'w', BLACK: 'b' };

export const GameStatus = {
  ACTIVE: 'active', CHECK: 'check',
  CHECKMATE: 'checkmate', STALEMATE: 'stalemate', DRAW: 'draw'
};

// ============================================================
// Board State
// ============================================================
export function createInitialBoard() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));

  const backRow = [
    PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN,
    PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK
  ];

  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRow[col], color: Color.BLACK };
    board[1][col] = { type: PieceType.PAWN, color: Color.BLACK };
    board[6][col] = { type: PieceType.PAWN, color: Color.WHITE };
    board[7][col] = { type: backRow[col], color: Color.WHITE };
  }

  return board;
}

export function cloneBoard(board) {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

// ============================================================
// Game State Object
// ============================================================
export function createGameState() {
  return {
    board: createInitialBoard(),
    turn: Color.WHITE,
    status: GameStatus.ACTIVE,
    enPassantTarget: null,          // { row, col } ô có thể bắt tốt qua đường
    castlingRights: {               // quyền nhập thành
      [Color.WHITE]: { kingSide: true, queenSide: true },
      [Color.BLACK]: { kingSide: true, queenSide: true }
    },
    moveHistory: [],
    capturedPieces: { [Color.WHITE]: [], [Color.BLACK]: [] },
    halfMoveClock: 0,
    fullMoveNumber: 1
  };
}

// ============================================================
// Helpers
// ============================================================
function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function enemy(color) { return color === Color.WHITE ? Color.BLACK : Color.WHITE; }

function findKing(board, color) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.type === PieceType.KING && board[r][c]?.color === color)
        return { row: r, col: c };
  return null;
}

// ============================================================
// Pseudo-legal Move Generation (không lọc chiếu)
// ============================================================
function getPseudoMoves(board, row, col, enPassantTarget, castlingRights) {
  const piece = board[row][col];
  if (!piece) return [];

  const moves = [];
  const { type, color } = piece;
  const dir = color === Color.WHITE ? -1 : 1;  // pawn direction

  const addSlide = (dr, dc) => {
    let r = row + dr, c = col + dc;
    while (inBounds(r, c)) {
      if (!board[r][c]) {
        moves.push({ from: { row, col }, to: { row: r, col: c } });
      } else {
        if (board[r][c].color !== color)
          moves.push({ from: { row, col }, to: { row: r, col: c } });
        break;
      }
      r += dr; c += dc;
    }
  };

  const addStep = (dr, dc, mustCapture = false, cantCapture = false) => {
    const r = row + dr, c = col + dc;
    if (!inBounds(r, c)) return;
    const target = board[r][c];
    if (mustCapture && (!target || target.color === color)) return;
    if (cantCapture && target) return;
    if (!mustCapture && target?.color === color) return;
    moves.push({ from: { row, col }, to: { row: r, col: c } });
  };

  switch (type) {
    case PieceType.PAWN: {
      // Đi thẳng 1 ô
      addStep(dir, 0, false, true);
      // Đi thẳng 2 ô từ vị trí ban đầu
      const startRow = color === Color.WHITE ? 6 : 1;
      if (row === startRow && !board[row + dir][col] && !board[row + 2 * dir][col])
        moves.push({ from: { row, col }, to: { row: row + 2 * dir, col }, flags: ['pawnDouble'] });
      // Bắt chéo
      addStep(dir, -1, true);
      addStep(dir, 1, true);
      // En passant
      if (enPassantTarget) {
        const { row: epR, col: epC } = enPassantTarget;
        if (epR === row + dir && (epC === col - 1 || epC === col + 1)) {
          moves.push({ from: { row, col }, to: { row: epR, col: epC }, flags: ['enPassant'] });
        }
      }
      // Phong cấp — đánh dấu nếu đến hàng cuối
      const promotionRow = color === Color.WHITE ? 0 : 7;
      moves.forEach(m => {
        if (m.to.row === promotionRow && m.from.row === row &&
            m.from.col === col && !m.flags?.includes('enPassant')) {
          m.flags = [...(m.flags || []), 'promotion'];
        }
      });
      break;
    }

    case PieceType.ROOK:
      [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => addSlide(dr, dc));
      break;

    case PieceType.BISHOP:
      [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc]) => addSlide(dr, dc));
      break;

    case PieceType.QUEEN:
      [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc]) => addSlide(dr, dc));
      break;

    case PieceType.KNIGHT:
      [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
        .forEach(([dr,dc]) => addStep(dr, dc));
      break;

    case PieceType.KING: {
      [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
        .forEach(([dr,dc]) => addStep(dr, dc));
      // Nhập thành
      const rights = castlingRights[color];
      const baseRow = color === Color.WHITE ? 7 : 0;
      if (row === baseRow && col === 4) {
        // King-side
        if (rights.kingSide &&
            !board[baseRow][5] && !board[baseRow][6] &&
            board[baseRow][7]?.type === PieceType.ROOK) {
          moves.push({ from: { row, col }, to: { row: baseRow, col: 6 }, flags: ['castleKing'] });
        }
        // Queen-side
        if (rights.queenSide &&
            !board[baseRow][3] && !board[baseRow][2] && !board[baseRow][1] &&
            board[baseRow][0]?.type === PieceType.ROOK) {
          moves.push({ from: { row, col }, to: { row: baseRow, col: 2 }, flags: ['castleQueen'] });
        }
      }
      break;
    }
  }

  return moves;
}

// ============================================================
// Attack Detection
// ============================================================
function isSquareAttackedBy(board, row, col, byColor) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.color !== byColor) continue;
      const pseudos = getPseudoMoves(board, r, c, null, {
        [Color.WHITE]: { kingSide: false, queenSide: false },
        [Color.BLACK]: { kingSide: false, queenSide: false }
      });
      if (pseudos.some(m => m.to.row === row && m.to.col === col)) return true;
    }
  }
  return false;
}

export function isInCheck(board, color) {
  const king = findKing(board, color);
  if (!king) return false;
  return isSquareAttackedBy(board, king.row, king.col, enemy(color));
}

// ============================================================
// Apply Move (returns new board state)
// ============================================================
export function applyMove(board, move, promotionType = PieceType.QUEEN) {
  const newBoard = cloneBoard(board);
  const { from, to, flags = [] } = move;
  const piece = newBoard[from.row][from.col];

  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = null;

  // En passant capture
  if (flags.includes('enPassant')) {
    const capturedPawnRow = from.row;
    newBoard[capturedPawnRow][to.col] = null;
  }

  // Promotion
  if (flags.includes('promotion')) {
    newBoard[to.row][to.col] = { type: promotionType, color: piece.color };
  }

  // Castling — move rook too
  if (flags.includes('castleKing')) {
    const r = from.row;
    newBoard[r][5] = newBoard[r][7];
    newBoard[r][7] = null;
  }
  if (flags.includes('castleQueen')) {
    const r = from.row;
    newBoard[r][3] = newBoard[r][0];
    newBoard[r][0] = null;
  }

  return newBoard;
}

// ============================================================
// Legal Move Generation (lọc chiếu)
// ============================================================
export function getLegalMoves(gameState, row, col) {
  const { board, turn, enPassantTarget, castlingRights } = gameState;
  const piece = board[row][col];
  if (!piece || piece.color !== turn) return [];

  const pseudos = getPseudoMoves(board, row, col, enPassantTarget, castlingRights);
  const legal = [];

  for (const move of pseudos) {
    const flags = move.flags || [];

    // Validate castling — vua không được đi qua ô bị tấn công
    if (flags.includes('castleKing')) {
      const baseRow = turn === Color.WHITE ? 7 : 0;
      if (isSquareAttackedBy(board, baseRow, 4, enemy(turn)) ||
          isSquareAttackedBy(board, baseRow, 5, enemy(turn)) ||
          isSquareAttackedBy(board, baseRow, 6, enemy(turn))) continue;
    }
    if (flags.includes('castleQueen')) {
      const baseRow = turn === Color.WHITE ? 7 : 0;
      if (isSquareAttackedBy(board, baseRow, 4, enemy(turn)) ||
          isSquareAttackedBy(board, baseRow, 3, enemy(turn)) ||
          isSquareAttackedBy(board, baseRow, 2, enemy(turn))) continue;
    }

    const newBoard = applyMove(board, move);
    if (!isInCheck(newBoard, turn)) legal.push(move);
  }

  return legal;
}

// ============================================================
// Make Move — returns new full GameState
// ============================================================
export function makeMove(gameState, move, promotionType = PieceType.QUEEN) {
  const { board, turn, castlingRights, moveHistory, capturedPieces, halfMoveClock, fullMoveNumber } = gameState;
  const { from, to, flags = [] } = move;
  const piece = board[from.row][from.col];
  const captured = board[to.row][to.col];

  const newBoard = applyMove(board, move, promotionType);
  const newTurn = enemy(turn);

  // En passant target update
  let newEnPassant = null;
  if (flags.includes('pawnDouble')) {
    newEnPassant = {
      row: (from.row + to.row) / 2,
      col: from.col
    };
  }

  // Update castling rights
  const newCastling = {
    [Color.WHITE]: { ...castlingRights[Color.WHITE] },
    [Color.BLACK]: { ...castlingRights[Color.BLACK] }
  };
  if (piece.type === PieceType.KING) {
    newCastling[turn].kingSide = false;
    newCastling[turn].queenSide = false;
  }
  if (piece.type === PieceType.ROOK) {
    const baseRow = turn === Color.WHITE ? 7 : 0;
    if (from.row === baseRow && from.col === 7) newCastling[turn].kingSide = false;
    if (from.row === baseRow && from.col === 0) newCastling[turn].queenSide = false;
  }

  // Captured pieces
  const newCaptured = {
    [Color.WHITE]: [...capturedPieces[Color.WHITE]],
    [Color.BLACK]: [...capturedPieces[Color.BLACK]]
  };
  if (captured) newCaptured[turn].push(captured);
  if (flags.includes('enPassant')) {
    newCaptured[turn].push({ type: PieceType.PAWN, color: newTurn });
  }

  // Move history entry
  const historyEntry = {
    from, to, piece, captured,
    flags, promotionType: flags.includes('promotion') ? promotionType : null,
    notation: getMoveNotation(board, move, promotionType)
  };

  // Clock
  const isCapture = !!captured || flags.includes('enPassant');
  const isPawnMove = piece.type === PieceType.PAWN;
  const newHalfMove = (isCapture || isPawnMove) ? 0 : halfMoveClock + 1;

  // Check new game status
  const nextState = {
    board: newBoard,
    turn: newTurn,
    status: GameStatus.ACTIVE,
    enPassantTarget: newEnPassant,
    castlingRights: newCastling,
    moveHistory: [...moveHistory, historyEntry],
    capturedPieces: newCaptured,
    halfMoveClock: newHalfMove,
    fullMoveNumber: turn === Color.BLACK ? fullMoveNumber + 1 : fullMoveNumber
  };

  nextState.status = computeStatus(nextState);
  return nextState;
}

// ============================================================
// Status Computation
// ============================================================
function computeStatus(gameState) {
  const { board, turn } = gameState;
  const hasLegal = hasAnyLegalMove(gameState);

  if (!hasLegal) {
    return isInCheck(board, turn) ? GameStatus.CHECKMATE : GameStatus.STALEMATE;
  }
  if (isInCheck(board, turn)) return GameStatus.CHECK;

  // 50-move rule
  if (gameState.halfMoveClock >= 100) return GameStatus.DRAW;

  return GameStatus.ACTIVE;
}

function hasAnyLegalMove(gameState) {
  const { board, turn } = gameState;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.color === turn) {
        if (getLegalMoves(gameState, r, c).length > 0) return true;
      }
    }
  }
  return false;
}

// ============================================================
// Algebraic Notation
// ============================================================
function getMoveNotation(board, move, promotionType) {
  const { from, to, flags = [] } = move;
  const piece = board[from.row][from.col];
  if (!piece) return '';

  const cols = 'abcdefgh';
  const fromSq = `${cols[from.col]}${8 - from.row}`;
  const toSq = `${cols[to.col]}${8 - to.row}`;

  if (flags.includes('castleKing')) return 'O-O';
  if (flags.includes('castleQueen')) return 'O-O-O';

  const pieceSymbol = piece.type === PieceType.PAWN ? '' : piece.type;
  const capture = (board[to.row][to.col] || flags.includes('enPassant')) ? 'x' : '';
  const pawnFile = (piece.type === PieceType.PAWN && capture) ? cols[from.col] : '';
  const promo = flags.includes('promotion') ? `=${promotionType}` : '';

  return `${pieceSymbol}${pawnFile}${capture}${toSq}${promo}`;
}

// ============================================================
// Undo Move
// ============================================================
export function undoMove(gameState) {
  if (gameState.moveHistory.length === 0) return gameState;

  // Tái tạo state từ đầu (đơn giản nhất, đủ nhanh cho game thông thường)
  const history = gameState.moveHistory.slice(0, -1);
  let state = createGameState();
  for (const entry of history) {
    const move = { from: entry.from, to: entry.to, flags: entry.flags };
    state = makeMove(state, move, entry.promotionType || PieceType.QUEEN);
  }
  return state;
}

export function getAllLegalMovesForColor(gameState, color) {
  const savedTurn = gameState.turn;
  const tempState = { ...gameState, turn: color };
  const moves = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      moves.push(...getLegalMoves(tempState, r, c));
  return moves;
}
