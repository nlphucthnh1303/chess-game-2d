using ChessEngine.Enums;
using ChessEngine.Models;
using ChessEngine.Board;

namespace ChessEngine.Pieces;

/// <summary>
/// Đại diện cho quân Tượng / Mã chéo (Bishop).
/// Quy tắc di chuyển: Di chuyển theo 4 đường chéo không giới hạn ô cho tới khi gặp chướng ngại vật.
/// </summary>
public class Bishop : Piece
{
    public override PieceType Type => PieceType.Bishop;

    public Bishop(ChessColor color) : base(color)
    {
    }

    /// <summary>
    /// Tính toán các nước đi khả thi cho quân Tượng theo 4 đường chéo.
    /// </summary>
    public override IEnumerable<Move> GetPossibleMoves(Position currentPos, BoardManager board)
    {
        // TODO: [Bước 1] Định nghĩa 4 hướng chéo (deltaRow, deltaCol): (-1, -1), (-1, 1), (1, -1), (1, 1).
        // TODO: [Bước 2] Với mỗi hướng, chạy vòng lặp tịnh tiến từng ô cho tới khi ra khỏi bàn cờ hoặc đụng quân cờ:
        //       - Nếu gặp ô trống -> Thêm Move và tiếp tục tịnh tiến.
        //       - Nếu gặp quân đối phương -> Thêm Move (ăn quân) và BẮT BUỘC DỪNG tịnh tiến hướng đó.
        //       - Nếu gặp quân phe mình -> BẮT BUỘC DỪNG tịnh tiến hướng đó.
        // TODO: [Bước 3] Trả về danh sách nước đi thu thập được.
        throw new NotImplementedException();
    }

    public override Piece Copy()
    {
        // TODO: Tạo Bishop mới cùng màu và copy HasMoved.
        throw new NotImplementedException();
    }
}
