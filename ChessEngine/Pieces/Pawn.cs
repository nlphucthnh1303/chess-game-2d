using ChessEngine.Enums;
using ChessEngine.Models;
using ChessEngine.Board;

namespace ChessEngine.Pieces;

/// <summary>
/// Đại diện cho quân Tốt (Pawn).
/// Quy tắc di chuyển: Tiến 1 ô, tiến 2 ô ở nước đầu tiên, ăn chéo 1 ô, bắt Tốt qua đường (En Passant) và phong cấp.
/// </summary>
public class Pawn : Piece
{
    public override PieceType Type => PieceType.Pawn;

    public Pawn(ChessColor color) : base(color)
    {
    }

    /// <summary>
    /// Tính toán các nước đi khả thi cho quân Tốt.
    /// </summary>
    public override IEnumerable<Move> GetPossibleMoves(Position currentPos, BoardManager board)
    {
        // TODO: [Bước 1] Xác định hướng đi deltaRow (Ví dụ: Trắng đi -1 nếu Hàng 7 ở trên, hoặc +1 tùy quy ước tọa độ).
        // TODO: [Bước 2] Tính toán nước đi TIẾN 1 Ô phái trước:
        //       - Check Position frontPos = currentPos + (deltaRow, 0).
        //       - Nếu board.IsEmpty(frontPos) -> Thêm nước đi MoveType.Normal (Hoặc MoveType.Promotion nếu frontPos nằm ở hàng cuối).
        // TODO: [Bước 3] Tính toán nước đi TIẾN 2 Ô phía trước (Chỉ khi HasMoved == false):
        //       - Check Position doubleFrontPos = currentPos + (2 * deltaRow, 0).
        //       - Nếu board.IsEmpty(frontPos) VÀ board.IsEmpty(doubleFrontPos) -> Thêm nước đi MoveType.PawnDoubleStep.
        // TODO: [Bước 4] Tính toán 2 nước đi ĂN CHÉO (Trái chéo và Phải chéo):
        //       - Check Position captureLeft = currentPos + (deltaRow, -1) và captureRight = currentPos + (deltaRow, 1).
        //       - Nếu ô chéo có quân cờ đối phương -> Thêm nước đi ăn quân (Normal hoặc Promotion).
        //       - Nếu ô chéo trùng với vị trí EnPassantTarget của ván cờ -> Thêm nước đi MoveType.EnPassant.
        // TODO: [Bước 5] Trả về danh sách các nước đi tìm được.
        throw new NotImplementedException();
    }

    public override Piece Copy()
    {
        var copy = new Pawn(Color);
        copy.HasMoved = HasMoved;
        return copy;
    }
}
