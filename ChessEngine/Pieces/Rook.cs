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
        // TODO: [Bước 1] Định nghĩa 4 hướng thẳng: (-1, 0), (1, 0), (0, -1), (0, 1).
        // TODO: [Bước 2] Với mỗi hướng, tịnh tiến từng ô cho tới khi ra ngoài bàn cờ hoặc vướng quân cờ khác.
        //       - Ô trống -> Thêm Move, tiếp tục.
        //       - Quân đối phương -> Thêm Move ăn quân, dừng lại.
        //       - Quân phe mình -> Dừng lại.
        // TODO: [Bước 3] Trả về tất cả các nước đi tìm được.
        throw new NotImplementedException();
    }

    public override Piece Copy()
    {
        // TODO: Tạo Rook mới cùng màu và copy HasMoved.
        throw new NotImplementedException();
    }
}
