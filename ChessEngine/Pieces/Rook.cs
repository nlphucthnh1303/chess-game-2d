using ChessEngine.Enums;
using ChessEngine.Models;
using ChessEngine.Board;

namespace ChessEngine.Pieces;

/// <summary>
/// Đại diện cho quân Xe (Rook).
/// Quy tắc di chuyển: Di chuyển theo 4 hướng ngang / dọc không giới hạn ô cho tới khi gặp chướng ngại vật. Tham gia Nhập thành.
/// </summary>
public class Rook : Piece
{
    public override PieceType Type => PieceType.Rook;

    public Rook(ChessColor color) : base(color)
    {
    }

    /// <summary>
    /// Tính toán các nước đi khả thi cho quân Xe theo 4 hướng ngang/dọc.
    /// </summary>
    public override IEnumerable<Move> GetPossibleMoves(Position currentPos, BoardManager board)
    {
        var moves = new List<Move>();
        var directions = new (int deltaRow, int deltaCol)[]
        {
            (-1, 0), (1, 0), (0, -1), (0, 1)
        };

        foreach (var dir in directions)
        {
            Position nextPos = currentPos + dir;

            while (board.IsInside(nextPos))
            {
                Piece? pieceAtNextPos = board.GetPiece(nextPos);

                if (pieceAtNextPos == null)
                {
                    moves.Add(new Move(currentPos, nextPos));
                    nextPos = nextPos + dir;
                }
                else
                {
                    if (pieceAtNextPos.Color != this.Color)
                    {
                        moves.Add(new Move(currentPos, nextPos));
                    }
                    break;
                }
            }
        }

        return moves;
    }

    public override Piece Copy()
    {
        return new Rook(this.Color) { HasMoved = this.HasMoved };
    }
}
