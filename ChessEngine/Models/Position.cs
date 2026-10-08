namespace ChessEngine.Models;

/// <summary>
/// Readonly Struct biểu diễn vị trí ô cờ trên bàn cờ 8x8.
/// Tọa độ ma trận: Row (0 đến 7), Column (0 đến 7).
/// </summary>
public readonly struct Position
{
    /// <summary>
    /// Chỉ số Hàng (Row): 0 đến 7 (Hàng 0 tương ứng hàng 1 hoặc 8 trên bàn cờ tùy quy ước hiển thị).
    /// </summary>
    public int Row { get; }

    /// <summary>
    /// Chỉ số Cột (Column): 0 đến 7 (Tương ứng các cột a, b, c, d, e, f, g, h).
    /// </summary>
    public int Column { get; }

    /// <summary>
    /// Khởi tạo vị trí ô cờ.
    /// </summary>
    public Position(int row, int column)
    {
        Row = row;
        Column = column;
    }

    /// <summary>
    /// Kiểm tra vị trí hiện tại có nằm trong phạm vi bàn cờ (8x8) hay không.
    /// </summary>
    /// <returns>True nếu ô nằm trong bàn cờ (0 <= Row <= 7 và 0 <= Column <= 7)</returns>
    public bool IsOnBoard()
    {
        // TODO: [Bước 1] Trả về kết quả so sánh: Row >= 0 && Row < 8 && Column >= 0 && Column < 8.
        throw new NotImplementedException();
    }

    /// <summary>
    /// Ký hiệu tên ô cờ theo tiêu chuẩn đại số (Ví dụ: Column 0, Row 0 -> "a1" hoặc "a8").
    /// </summary>
    public string SquareName
    {
        get
        {
            // TODO: [Bước 1] Chuyển Column (0..7) thành ký tự ('a'..'h'): (char)('a' + Column).
            // TODO: [Bước 2] Chuyển Row (0..7) thành số hàng tương ứng (1..8 hoặc 8..1 tùy quy ước).
            // TODO: [Bước 3] Trả về chuỗi kết hợp (ví dụ "e4").
            throw new NotImplementedException();
        }
    }

    /// <summary>
    /// Nạp chồng toán tử + để dịch chuyển vị trí theo khoảng biến thiên (deltaRow, deltaColumn).
    /// </summary>
    public static Position operator +(Position pos, (int deltaRow, int deltaCol) offset)
    {
        // TODO: [Bước 1] Trả về new Position(pos.Row + offset.deltaRow, pos.Column + offset.deltaCol).
        throw new NotImplementedException();
    }

    public static bool operator ==(Position left, Position right)
    {
        return left.Row == right.Row && left.Column == right.Column;
    }

    public static bool operator !=(Position left, Position right)
    {
        return !(left == right);
    }

    public override bool Equals(object? obj)
    {
        return obj is Position other && this == other;
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(Row, Column);
    }
}
