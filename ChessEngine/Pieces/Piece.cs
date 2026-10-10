using ChessEngine.Enums;
using ChessEngine.Models;
using ChessEngine.Board;

namespace ChessEngine.Pieces;

/// <summary>
/// Lớp trừu tượng cơ sở (Abstract Class) cho tất cả các loại quân cờ.
/// Định nghĩa các thuộc tính chung (Color, HasMoved, Type) và hợp đồng tính toán nước đi (GetPossibleMoves).
/// </summary>
public abstract class Piece
{
    /// <summary>
    /// Màu sắc của quân cờ (Trắng hoặc Đen).
    /// </summary>
    public ChessColor Color { get; }

    /// <summary>
    /// Thuộc tính trừu tượng trả về loại quân cờ (Pawn, Knight, Bishop, Rook, Queen, King).
    /// </summary>
    public abstract PieceType Type { get; }

    /// <summary>
    /// Đánh dấu quân cờ này đã từng di chuyển chưa (Quan trọng đối với Tốt, Xe và Vua).
    /// </summary>
    public bool HasMoved { get; set; }

    /// <summary>
    /// Khởi tạo quân cờ với màu sắc được truyền vào.
    /// </summary>
    protected Piece(ChessColor color)
    {
        Color = color;
        HasMoved = false;
    }

    /// <summary>
    /// Phương thức trừu tượng: Tính toán tất cả các nước đi khả thi NGUYÊN TẮC của quân cờ tại vị trí hiện tại.
    /// (Chưa tính đến việc nước đi đó có làm cho Vua phe mình bị chiếu cờ hay không).
    /// </summary>
    /// <param name="currentPos">Vị trí hiện tại của quân cờ trên bàn cờ</param>
    /// <param name="board">Đối tượng quản lý bàn cờ</param>
    /// <returns>Danh sách các nước đi khả thi (Candidate Moves)</returns>
    public abstract IEnumerable<Move> GetPossibleMoves(Position currentPos, BoardManager board);

    /// <summary>
    /// Phương thức trừu tượng: Tạo bản sao độc lập (Deep Copy) của quân cờ này (Protoype Pattern).
    /// </summary>
    public abstract Piece Copy();

    /// <summary>
    /// Phương thức helper kiểm tra ô đích có thể di chuyển tới hay không (ô trống hoặc chứa quân đối phương).
    /// </summary>
    /// <param name="targetPos">Vị trí ô đích</param>
    /// <param name="board">Bàn cờ hiện tại</param>
    /// <returns>True nếu ô đích hợp lệ để đáp xuống</returns>
    protected virtual bool CanMoveTo(Position targetPos, BoardManager board)
    {
        if (!board.IsInside(targetPos)) return false;
        Piece? targetPiece = board.GetPiece(targetPos);
        return targetPiece == null || targetPiece.Color != Color;
    }
}
