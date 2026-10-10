using ChessEngine.Enums;
using ChessEngine.Models;
using ChessEngine.Pieces;

namespace ChessEngine.Board;

/// <summary>
/// Quản lý trạng thái và dữ liệu ma trận 8x8 của bàn cờ vua.
/// Chịu trách nhiệm khởi tạo vị trí các quân cờ, di chuyển quân, ăn quân và sao chép trạng thái bàn cờ.
/// </summary>
public class BoardManager
{
    /// <summary>
    /// Ma trận 2 chiều 8x8 chứa các đối tượng Piece (null đại diện cho ô cờ trống).
    /// </summary>
    private readonly Piece?[,] _pieces = new Piece?[8, 8];

    public Position? WhiteKingPosition { get; private set; }
    public Position? BlackKingPosition { get; private set; }

    /// <summary>
    /// Indexer cho phép truy cập quân cờ nhanh theo chỉ số hàng và cột [row, col].
    /// </summary>
    public Piece? this[int row, int col]
    {
        get => GetPiece(new Position(row, col));
        set => SetPiece(new Position(row, col), value);
    }

    /// <summary>
    /// Indexer cho phép truy cập quân cờ bằng struct Position.
    /// </summary>
    public Piece? this[Position pos]
    {
        get => GetPiece(pos);
        set => SetPiece(pos, value);
    }

    public BoardManager()
    {
        // Khởi tạo đối tượng bàn cờ
    }

    /// <summary>
    /// Đặt lại bàn cờ về vị trí xuất phát tiêu chuẩn của ván đấu cờ vua (32 quân cờ).
    /// </summary>
    public void ResetToStandardStartingPosition()
    {
        // TODO: [Bước 1] Duyệt qua ma trận 8x8 và gán tất cả về null để dọn sạch bàn cờ.
        // TODO: [Bước 2] Đặt các quân Trắng (ChessColor.White):
        //       - Hàng 0 (hoặc 7 tùy hệ tọa độ): Xe, Mã, Tượng, Hậu, Vua, Tượng, Mã, Xe.
        //       - Hàng 1 (hoặc 6): 8 quân Tốt (Pawn).
        // TODO: [Bước 3] Đặt các quân Đen (ChessColor.Black):
        //       - Hàng 7 (hoặc 0): Xe, Mã, Tượng, Hậu, Vua, Tượng, Mã, Xe.
        //       - Hàng 6 (hoặc 1): 8 quân Tốt (Pawn).
        throw new NotImplementedException();
    }

    /// <summary>
    /// Lấy quân cờ đang đứng tại vị trí chỉ định.
    /// </summary>
    /// <param name="pos">Vị trí ô cờ</param>
    /// <returns>Đối tượng Piece hoặc null nếu ô trống</returns>
    public Piece? GetPiece(Position pos)
    {
        // TODO: [Bước 1] Kiểm tra IsInside(pos). Nếu không hợp lệ, ném ngoại lệ ArgumentOutOfRangeException hoặc trả về null.
        // TODO: [Bước 2] Trả về _pieces[pos.Row, pos.Column].
        throw new NotImplementedException();
    }

    /// <summary>
    /// Đặt hoặc xóa một quân cờ tại vị trí ô cờ chỉ định.
    /// </summary>
    /// <param name="pos">Vị trí cần đặt</param>
    /// <param name="piece">Đối tượng quân cờ (hoặc null để xóa quân)</param>
    public void SetPiece(Position pos, Piece? piece)
    {
        if (!IsInside(pos)) throw new ArgumentOutOfRangeException(nameof(pos));

        var oldPiece = _pieces[pos.Row, pos.Column];
        if (oldPiece != null && oldPiece.Type == PieceType.King)
        {
            if (oldPiece.Color == ChessColor.White && WhiteKingPosition == pos) WhiteKingPosition = null;
            else if (oldPiece.Color == ChessColor.Black && BlackKingPosition == pos) BlackKingPosition = null;
        }

        if (piece != null && piece.Type == PieceType.King)
        {
            if (piece.Color == ChessColor.White) WhiteKingPosition = pos;
            else BlackKingPosition = pos;
        }

        _pieces[pos.Row, pos.Column] = piece;
    }

    /// <summary>
    /// Kiểm tra vị trí ô cờ có nằm trong giới hạn ma trận 8x8 hay không.
    /// </summary>
    public bool IsInside(Position pos)
    {
        return pos.Row >= 0 && pos.Row < 8 && pos.Column >= 0 && pos.Column < 8;
    }

    /// <summary>
    /// Kiểm tra xem ô cờ tại vị trí chỉ định có đang trống (không có quân cờ nào) hay không.
    /// </summary>
    public bool IsEmpty(Position pos)
    {
        // TODO: [Bước 1] Trả về IsInside(pos) && GetPiece(pos) == null.
        throw new NotImplementedException();
    }

    /// <summary>
    /// Cập nhật ma trận bàn cờ trực tiếp theo nước đi truyền vào.
    /// Xử lý các trường hợp: Đi thường, Nhập thành, Bắt Tốt qua đường, Phong cấp.
    /// </summary>
    /// <param name="move">Nước đi cần thực thi</param>
    public void ApplyMove(Move move)
    {
        // TODO: [Bước 1] Lấy quân cờ tại vị trí xuất phát: Piece? piece = GetPiece(move.StartPosition).
        // TODO: [Bước 2] Nếu piece == null -> Thất bại (ném ngoại lệ).
        // TODO: [Bước 3] Xử lý từng loại MoveType:
        //       - MoveType.Normal / MoveType.PawnDoubleStep:
        //           + SetPiece(move.StartPosition, null);
        //           + SetPiece(move.EndPosition, piece);
        //       - MoveType.EnPassant:
        //           + Xóa con Tốt bị bắt (nằm ở hàng của StartPosition và cột của EndPosition).
        //           + Di chuyển con Tốt hiện tại sang EndPosition.
        //       - MoveType.CastleKingside / CastleQueenside:
        //           + Di chuyển Vua từ StartPosition sang EndPosition.
        //           + Di chuyển Xe tương ứng sang vị trí ô Vua vừa nhảy qua.
        //       - MoveType.Promotion:
        //           + Khởi tạo quân cờ mới dựa trên move.PromotionPiece (Hậu/Xe/Tượng/Mã).
        //           + SetPiece(move.StartPosition, null);
        //           + SetPiece(move.EndPosition, newPromotedPiece);
        // TODO: [Bước 4] Đánh dấu piece.HasMoved = true.
        throw new NotImplementedException();
    }

    /// <summary>
    /// Tìm vị trí ô cờ của quân Vua theo màu chỉ định trên bàn cờ.
    /// </summary>
    /// <param name="color">Màu của quân Vua cần tìm</param>
    /// <returns>Tọa độ Position của Vua</returns>
    public Position FindKingPosition(ChessColor color)
    {
        var pos = color == ChessColor.White ? WhiteKingPosition : BlackKingPosition;
        if (pos.HasValue) return pos.Value;
        throw new InvalidOperationException("Không tìm thấy Vua trên bàn cờ");
    }

    /// <summary>
    /// Tạo một bản sao độc lập (Deep Copy) của bàn cờ hiện tại.
    /// Được sử dụng để giả lập nước đi và kiểm tra nước đi đó có khiến Vua bị chiếu hay không.
    /// </summary>
    /// <returns>Bản sao BoardManager mới</returns>
    public BoardManager Clone()
    {
        // TODO: [Bước 1] Khởi tạo newBoardManager = new BoardManager().
        // TODO: [Bước 2] Duyệt qua tất cả các ô trong _pieces[r, c].
        // TODO: [Bước 3] Nếu ô có quân cờ -> gọi piece.Copy() và gán vào newBoardManager[r, c].
        // TODO: [Bước 4] Trả về newBoardManager.
        throw new NotImplementedException();
    }
}
