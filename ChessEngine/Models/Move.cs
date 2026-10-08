using ChessEngine.Enums;

namespace ChessEngine.Models;

/// <summary>
/// Biểu diễn một nước đi đầy đủ trong Cờ Vua.
/// Lưu trữ vị trí đầu, vị trí cuối, kiểu nước đi và thông tin phong cấp nếu có.
/// </summary>
public class Move
{
    /// <summary>
    /// Vị trí xuất phát của quân cờ.
    /// </summary>
    public Position StartPosition { get; }

    /// <summary>
    /// Vị trí đích đến của quân cờ.
    /// </summary>
    public Position EndPosition { get; }

    /// <summary>
    /// Phân loại loại nước đi (Di chuyển thường, Bắt Tốt qua đường, Nhập thành, Phong cấp).
    /// </summary>
    public MoveType Type { get; }

    /// <summary>
    /// Loại quân cờ được chọn khi thực hiện nước đi Phong cấp (Queen, Rook, Bishop, Knight).
    /// </summary>
    public PieceType? PromotionPiece { get; }

    /// <summary>
    /// Khởi tạo một thông tin nước đi.
    /// </summary>
    public Move(Position start, Position end, MoveType type = MoveType.Normal, PieceType? promotionPiece = null)
    {
        StartPosition = start;
        EndPosition = end;
        Type = type;
        PromotionPiece = promotionPiece;
    }

    /// <summary>
    /// Chuỗi mô tả nước đi (Phục vụ debug hoặc hiển thị danh sách lịch sử nước đi).
    /// </summary>
    public override string ToString()
    {
        // TODO: [Bước 1] Định dạng chuỗi hiển thị ví dụ: $"{StartPosition.SquareName} -> {EndPosition.SquareName}".
        // TODO: [Bước 2] Bổ sung hậu tố nếu là nước đi đặc biệt (Ví dụ: "=Q" khi phong cấp Hậu, "e.p" khi bắt Tốt qua đường).
        throw new NotImplementedException();
    }
}
