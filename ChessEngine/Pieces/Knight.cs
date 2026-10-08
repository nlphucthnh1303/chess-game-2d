using ChessEngine.Enums;
using ChessEngine.Models;
using ChessEngine.Board;

namespace ChessEngine.Pieces;

/// <summary>
/// Đại diện cho quân Mã (Knight).
/// Quy tắc di chuyển: Nhảy theo hình chữ L (8 hướng), có khả năng nhảy qua các quân cờ khác.
/// </summary>
public class Knight : Piece
{
    public override PieceType Type => PieceType.Knight;

    public Knight(ChessColor color) : base(color)
    {
    }

    /// <summary>
    /// Tính toán các nước đi khả thi cho quân Mã theo 8 hướng hình chữ L.
    /// </summary>
    public override IEnumerable<Move> GetPossibleMoves(Position currentPos, BoardManager board)
    {
        // TODO: [Bước 1] Định nghĩa mảng 8 offset hình chữ L:
        //       (-2, -1), (-2, 1), (-1, -2), (-1, 2), (1, -2), (1, 2), (2, -1), (2, 1).
        // TODO: [Bước 2] Lặp qua từng offset, tính vị trí đích targetPos = currentPos + offset.
        // TODO: [Bước 3] Nếu CanMoveTo(targetPos, board) == true -> Thêm new Move(currentPos, targetPos) vào kết quả.
        // TODO: [Bước 4] Trả về tập hợp các nước đi hợp lệ về mặt di chuyển.
        throw new NotImplementedException();
    }

    public override Piece Copy()
    {
        // TODO: Tạo Knight mới cùng màu và copy HasMoved.
        throw new NotImplementedException();
    }
}
