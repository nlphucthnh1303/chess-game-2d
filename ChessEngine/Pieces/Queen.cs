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
        // TODO: [Bước 1] Định nghĩa 8 hướng di chuyển (Ngang, Dọc và 4 đường Chéo).
        // TODO: [Bước 2] Lặp tịnh tiến trên cả 8 hướng cho tới khi bị chắn hoặc ra khỏi bàn cờ.
        // TODO: [Bước 3] Thu thập danh sách các ô có thể đi/ăn quân và trả về.
        throw new NotImplementedException();
    }

    public override Piece Copy()
    {
        // TODO: Tạo Queen mới cùng màu và copy HasMoved.
        throw new NotImplementedException();
    }
}
