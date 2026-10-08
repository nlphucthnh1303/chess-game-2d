namespace ChessEngine.Enums;

/// <summary>
/// Biểu diễn trạng thái hiện tại của ván đấu Cờ Vua.
/// </summary>
public enum GameState
{
    /// <summary>
    /// Ván đấu đang diễn ra bình thường.
    /// </summary>
    Active,

    /// <summary>
    /// Vua đang bị chiếu (Check).
    /// </summary>
    Check,

    /// <summary>
    /// Chiếu bí (Checkmate) - Ván đấu kết thúc, phe bị chiếu thua.
    /// </summary>
    Checkmate,

    /// <summary>
    /// Hòa bế tắc (Stalemate) - Không có nước đi hợp lệ nhưng Vua không bị chiếu.
    /// </summary>
    Stalemate,

    /// <summary>
    /// Hòa do không đủ quân để chiếu bí (Insufficient Material).
    /// </summary>
    DrawByInsufficientMaterial,

    /// <summary>
    /// Hòa theo luật (Quy tắc 50 nước đi hoặc Lặp lại vị trí 3 lần).
    /// </summary>
    DrawByRule
}
