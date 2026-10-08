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
        // TODO: [Bước 1] Định nghĩa 8 hướng di chuyển 1 ô xung quanh Vua:
        //       (-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1).
        // TODO: [Bước 2] Với mỗi hướng, tính targetPos = currentPos + offset.
        //       - Nếu CanMoveTo(targetPos, board) == true -> Thêm new Move(currentPos, targetPos).
        // TODO: [Bước 3] Kiểm tra điều kiện Nhập thành (Castling):
        //       - Điều kiện: HasMoved == false và Vua hiện tại KHÔNG bị chiếu.
        //       - Nhập thành gần (Kingside): Xe ở góc chưa di chuyển (HasMoved == false) và khoảng giữa trống.
        //       - Nhập thành xa (Queenside): Xe ở góc chưa di chuyển và khoảng giữa trống.
        //       - (Lưu ý: Các ô Vua đi qua không được đang bị đối phương kiểm soát/tấn công).
        // TODO: [Bước 4] Trả về danh sách nước đi khả thi của Vua.
        throw new NotImplementedException();
    }

    public override Piece Copy()
    {
        // TODO: Tạo King mới cùng màu và copy HasMoved.
        throw new NotImplementedException();
    }
}
