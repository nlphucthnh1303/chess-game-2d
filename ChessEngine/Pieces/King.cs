using ChessEngine.Enums;
using ChessEngine.Models;
using ChessEngine.Board;

namespace ChessEngine.Pieces;

/// <summary>
/// Đại diện cho quân Vua (King).
/// Quy tắc di chuyển: 1 ô theo 8 hướng xung quanh. Xử lý các điều kiện Nhập thành (Kingside / Queenside Castling).
/// </summary>
public class King : Piece
{
    public override PieceType Type => PieceType.King;

    public King(ChessColor color) : base(color)
    {
    }

    /// <summary>
    /// Tính toán các nước đi khả thi cho quân Vua (Các ô xung quanh 1 ô và nước đi Nhập thành).
    /// </summary>
    public override IEnumerable<Move> GetPossibleMoves(Position currentPos, BoardManager board)
    {
        var moves = new List<Move>();

        var offsets = new (int, int)[]
        {
            (-1, -1), (-1, 0), (-1, 1),
            (0, -1),           (0, 1),
            (1, -1),  (1, 0),  (1, 1)
        };

        foreach (var offset in offsets)
        {
            int newRow = currentPos.Row + offset.Item1;
            int newCol = currentPos.Column + offset.Item2;

            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8)
            {
                var targetPos = new Position(newRow, newCol);
                if (CanMoveTo(targetPos, board))
                {
                    moves.Add(new Move(currentPos, targetPos));
                }
            }
        }

        // Castling
        if (!this.HasMoved && !IsSquareUnderAttack(currentPos, board))
        {
            // Kingside
            Piece? kingsideRook = board.GetPiece(new Position(currentPos.Row, 7));
            if (kingsideRook != null && kingsideRook.Type == PieceType.Rook && kingsideRook.Color == this.Color && !kingsideRook.HasMoved)
            {
                if (board.IsEmpty(new Position(currentPos.Row, 5)) && board.IsEmpty(new Position(currentPos.Row, 6)))
                {
                    if (!IsSquareUnderAttack(new Position(currentPos.Row, 5), board) && !IsSquareUnderAttack(new Position(currentPos.Row, 6), board))
                    {
                        moves.Add(new Move(currentPos, new Position(currentPos.Row, 6), MoveType.CastleKingside));
                    }
                }
            }

            // Queenside
            Piece? queensideRook = board.GetPiece(new Position(currentPos.Row, 0));
            if (queensideRook != null && queensideRook.Type == PieceType.Rook && queensideRook.Color == this.Color && !queensideRook.HasMoved)
            {
                if (board.IsEmpty(new Position(currentPos.Row, 1)) && board.IsEmpty(new Position(currentPos.Row, 2)) && board.IsEmpty(new Position(currentPos.Row, 3)))
                {
                    if (!IsSquareUnderAttack(new Position(currentPos.Row, 2), board) && !IsSquareUnderAttack(new Position(currentPos.Row, 3), board))
                    {
                        moves.Add(new Move(currentPos, new Position(currentPos.Row, 2), MoveType.CastleQueenside));
                    }
                }
            }
        }

        return moves;
    }

    private bool IsSquareUnderAttack(Position pos, BoardManager board)
    {
        for (int r = 0; r < 8; r++)
        {
            for (int c = 0; c < 8; c++)
            {
                var enemyPos = new Position(r, c);
                Piece? p = board.GetPiece(enemyPos);
                if (p != null && p.Color != this.Color)
                {
                    if (p.Type == PieceType.King)
                    {
                        if (Math.Abs(pos.Row - r) <= 1 && Math.Abs(pos.Column - c) <= 1)
                        {
                            return true;
                        }
                    }
                    else if (p.Type == PieceType.Pawn)
                    {
                        int dir = (p.Color == ChessColor.White) ? -1 : 1;
                        if (pos.Row == r + dir && Math.Abs(pos.Column - c) == 1)
                        {
                            return true;
                        }
                    }
                    else
                    {
                        var enemyMoves = p.GetPossibleMoves(enemyPos, board);
                        foreach (var m in enemyMoves)
                        {
                            if (m.EndPosition.Row == pos.Row && m.EndPosition.Column == pos.Column)
                            {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    public override Piece Copy()
    {
        return new King(this.Color) { HasMoved = this.HasMoved };
    }
}
