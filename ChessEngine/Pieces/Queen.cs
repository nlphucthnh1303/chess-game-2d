using ChessEngine.Enums;
using ChessEngine.Models;
using ChessEngine.Board;

namespace ChessEngine.Pieces;

/// <summary>
/// Đại diện cho quân Hậu (Queen).
/// Quy tắc di chuyển: Kết hợp sức mạnh của Xe và Tượng (8 hướng: Ngang, Dọc, Chéo).
/// </summary>
public class Queen : Piece
{
    public override PieceType Type => PieceType.Queen;

    public Queen(ChessColor color) : base(color)
    {
    }

    /// <summary>
    /// Tính toán các nước đi khả thi cho quân Hậu theo 8 hướng.
    /// </summary>
    public override IEnumerable<Move> GetPossibleMoves(Position currentPos, BoardManager board)
    {
        var moves = new List<Move>();

        // Định nghĩa 8 hướng di chuyển (Ngang, Dọc và 4 đường Chéo).
        (int deltaRow, int deltaCol)[] directions = {
            (-1, 0), (1, 0), (0, -1), (0, 1),
            (-1, -1), (-1, 1), (1, -1), (1, 1)
        };

        foreach (var dir in directions)
        {
            var targetPos = currentPos + dir;

            // Lặp tịnh tiến trên mỗi hướng
            while (board.IsInside(targetPos))
            {
                var targetPiece = board.GetPiece(targetPos);

                if (targetPiece == null)
                {
                    // Ô trống, có thể đi tiếp
                    moves.Add(new Move(currentPos, targetPos));
                }
                else
                {
                    // Đụng quân cờ
                    if (targetPiece.Color != this.Color)
                    {
                        // Quân đối phương -> Ăn quân và dừng lại hướng này
                        moves.Add(new Move(currentPos, targetPos));
                    }
                    // Bất kể quân phe nào, cũng bị chắn, không tịnh tiến thêm được nữa
                    break;
                }

                targetPos = targetPos + dir;
            }
        }

        return moves;
    }

    public override Piece Copy()
    {
        return new Queen(Color)
        {
            HasMoved = this.HasMoved
        };
    }
}
