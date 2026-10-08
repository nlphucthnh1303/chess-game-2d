using System;
using ChessEngine.Enums;

namespace ChessUI.Helpers;

/// <summary>
/// Class trợ giúp ánh xạ loại quân cờ và màu sắc thành đường dẫn hình ảnh (Assets/Images) tương ứng trên UI.
/// </summary>
public static class ChessImageHelper
{
    /// <summary>
    /// Lấy đường dẫn URI của tệp hình ảnh quân cờ tương ứng.
    /// Ví dụ: "Assets/Images/White_Pawn.png" hoặc "pack://application:,,,/Assets/Images/wP.png"
    /// </summary>
    /// <param name="color">Màu quân cờ (Trắng / Đen)</param>
    /// <param name="type">Loại quân cờ (Tốt, Mã, Tượng, Xe, Hậu, Vua)</param>
    /// <returns>Chuỗi đường dẫn URI hình ảnh</returns>
    public static string GetPieceImagePath(ChessColor color, PieceType type)
    {
        // TODO: [Bước 1] Ghép tên màu (White/Black) và tên loại quân cờ (Pawn/Knight/...).
        // TODO: [Bước 2] Trả về đường dẫn tài nguyên hình ảnh tương ứng trong dự án UI.
        // Ví dụ: return $"/Assets/Images/{color}_{type}.png";
        throw new NotImplementedException();
    }
}
