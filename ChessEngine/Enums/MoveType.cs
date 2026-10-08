namespace ChessEngine.Enums;

/// <summary>
/// Xác định loại nước đi trong ván cờ (phân biệt nước đi thường và các đặc quyền đặc biệt).
/// </summary>
public enum MoveType
{
    /// <summary>
    /// Nước đi di chuyển hoặc ăn quân thông thường.
    /// </summary>
    Normal,

    /// <summary>
    /// Tốt tiến 2 ô ở nước đi đầu tiên (tạo cơ hội cho đối phương bắt Tốt qua đường).
    /// </summary>
    PawnDoubleStep,

    /// <summary>
    /// Bắt Tốt qua đường (En Passant).
    /// </summary>
    EnPassant,

    /// <summary>
    /// Nhập thành gần / Cánh Vua (Kingside Castling - O-O).
    /// </summary>
    CastleKingside,

    /// <summary>
    /// Nhập thành xa / Cánh Hậu (Queenside Castling - O-O-O).
    /// </summary>
    CastleQueenside,

    /// <summary>
    /// Phong cấp cho Tốt khi tiến đến hàng cuối (Promotion).
    /// </summary>
    Promotion
}
