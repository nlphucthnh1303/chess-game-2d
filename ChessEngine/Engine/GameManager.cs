using ChessEngine.Enums;
using ChessEngine.Models;
using ChessEngine.Board;
using ChessEngine.Pieces;

namespace ChessEngine.Engine;

/// <summary>
/// Quản lý toàn bộ vòng đời và quy tắc ván đấu Cờ vua (Game Manager / Core Engine).
/// Điều khiển lượt chơi, lọc các nước đi hợp lệ (chống chiếu Vua), kiểm tra tình trạng chiếu/chiếu bí/hòa và quản lý lịch sử nước đi.
/// </summary>
public class GameManager
{
    /// <summary>
    /// Đối tượng quản lý trạng thái ma trận bàn cờ hiện tại.
    /// </summary>
    public BoardManager Board { get; }

    /// <summary>
    /// Lượt chơi hiện tại (ChessColor.White hoặc ChessColor.Black).
    /// </summary>
    public ChessColor CurrentTurn { get; private set; }

    /// <summary>
    /// Trạng thái hiện tại của ván cờ (Active, Check, Checkmate, Stalemate, Draw...).
    /// </summary>
    public GameState Status { get; private set; }

    /// <summary>
    /// Vị trí Tốt đối phương nhảy 2 ô vừa qua (Target cho Bắt Tốt Qua Đường - En Passant).
    /// </summary>
    public Position? EnPassantTarget { get; private set; }

    /// <summary>
    /// Danh sách lịch sử tất cả các nước đi đã được thực hiện trong ván cờ.
    /// </summary>
    public List<Move> MoveHistory { get; }

    /// <summary>
    /// Sự kiện phát ra khi một nước đi thực thi thành công (Dùng cho WPF UI cập nhật bàn cờ).
    /// </summary>
    public event EventHandler<MoveExecutedEventArgs>? MoveExecuted;

    /// <summary>
    /// Sự kiện phát ra khi trạng thái ván cờ thay đổi (Chiếu cờ, Chiếu bí, Hòa...).
    /// </summary>
    public event EventHandler<GameStateChangedEventArgs>? GameStateChanged;

    public GameManager()
    {
        Board = new BoardManager();
        CurrentTurn = ChessColor.White;
        Status = GameState.Active;
        MoveHistory = new List<Move>();
    }

    /// <summary>
    /// Bắt đầu một ván cờ mới từ đầu.
    /// Reset lại vị trí quân cờ, đặt lại lượt đi về phe Trắng, làm sạch lịch sử.
    /// </summary>
    public void StartNewGame()
    {
        // TODO: [Bước 1] Gọi Board.ResetToStandardStartingPosition() để sắp xếp 32 quân cờ.
        // TODO: [Bước 2] Thiết lập CurrentTurn = ChessColor.White.
        // TODO: [Bước 3] Thiết lập Status = GameState.Active.
        // TODO: [Bước 4] Xóa sạch MoveHistory và đặt EnPassantTarget = null.
        throw new NotImplementedException();
    }

    /// <summary>
    /// Lấy tất cả các nước đi HỢP LỆ (Legal Moves) của quân cờ tại vị trí pos.
    /// Loại bỏ tất cả các nước đi vi phạm quy tắc: Nước đi khiến Vua phe mình bị chiếu cờ.
    /// </summary>
    /// <param name="pos">Vị trí quân cờ được chọn</param>
    /// <returns>Tập hợp các Move hợp lệ</returns>
    public IEnumerable<Move> GetLegalMoves(Position pos)
    {
        // TODO: [Bước 1] Lấy quân cờ tại pos: Piece? piece = Board.GetPiece(pos).
        // TODO: [Bước 2] Nếu piece == null HOẶC piece.Color != CurrentTurn -> Trả về danh sách rỗng (Enumerable.Empty<Move>()).
        // TODO: [Bước 3] Lấy danh sách nước đi khả thi ban đầu: IEnumerable<Move> candidateMoves = piece.GetPossibleMoves(pos, Board).
        // TODO: [Bước 4] Khởi tạo danh sách kết quả validMoves.
        // TODO: [Bước 5] Với mỗi move trong candidateMoves:
        //       - Tạo bản sao bàn cờ thử nghiệm: BoardManager testBoard = Board.Clone().
        //       - Thực thi thử move trên testBoard: testBoard.ApplyMove(move).
        //       - Kiểm tra Vua phe mình có bị chiếu trên testBoard hay không: IsKingInCheckOnBoard(CurrentTurn, testBoard).
        //       - Nếu KHÔNG bị chiếu -> Thêm move vào validMoves.
        // TODO: [Bước 6] Trả về validMoves.
        throw new NotImplementedException();
    }

    /// <summary>
    /// Thực thi nước đi được chọn nếu nước đi đó hợp lệ.
    /// </summary>
    /// <param name="move">Nước đi người chơi muốn thực hiện</param>
    /// <returns>True nếu thực hiện thành công, False nếu nước đi không hợp lệ</returns>
    public bool MakeMove(Move move)
    {
        // TODO: [Bước 1] Gọi GetLegalMoves(move.StartPosition) để kiểm tra move có nằm trong danh sách nước đi hợp lệ không.
        // TODO: [Bước 2] Nếu không hợp lệ -> Trả về false.
        // TODO: [Bước 3] Áp dụng nước đi lên bàn cờ thật: Board.ApplyMove(move).
        // TODO: [Bước 4] Cập nhật EnPassantTarget:
        //       - Nếu move.Type == MoveType.PawnDoubleStep -> EnPassantTarget = ô nằm giữa StartPosition và EndPosition.
        //       - Ngược lại -> EnPassantTarget = null.
        // TODO: [Bước 5] Thêm move vào MoveHistory.
        // TODO: [Bước 6] Đổi lượt chơi: CurrentTurn = CurrentTurn == ChessColor.White ? ChessColor.Black : ChessColor.White.
        // TODO: [Bước 7] Cập nhật lại trạng thái ván đấu: UpdateGameState().
        // TODO: [Bước 8] Kích hoạt sự kiện MoveExecuted?.Invoke(this, new MoveExecutedEventArgs(move)).
        // TODO: [Bước 9] Trả về true.
        throw new NotImplementedException();
    }

    /// <summary>
    /// Kiểm tra Vua của phe chỉ định có đang bị phe đối phương tấn công (chiếu cờ) trên bàn cờ hiện tại hay không.
    /// </summary>
    /// <param name="kingColor">Màu Vua cần kiểm tra</param>
    /// <returns>True nếu Vua đang bị chiếu</returns>
    public bool IsKingInCheck(ChessColor kingColor)
    {
        // TODO: [Bước 1] Gọi IsKingInCheckOnBoard(kingColor, Board).
        throw new NotImplementedException();
    }

    /// <summary>
    /// Phương thức hỗ trợ kiểm tra xem Vua của màu kingColor có bị chiếu trên một đối tượng BoardManager cụ thể hay không.
    /// </summary>
    private bool IsKingInCheckOnBoard(ChessColor kingColor, BoardManager targetBoard)
    {
        // TODO: [Bước 1] Tìm vị trí Vua: Position kingPos = targetBoard.FindKingPosition(kingColor).
        // TODO: [Bước 2] Xác định màu đối phương: ChessColor enemyColor = kingColor == ChessColor.White ? ChessColor.Black : ChessColor.White.
        // TODO: [Bước 3] Duyệt qua tất cả ô trên targetBoard:
        //       - Nếu ô chứa quân của enemyColor -> Lấy piece.GetPossibleMoves(enemyPos, targetBoard).
        //       - Nếu có bất kỳ nước đi nào có EndPosition == kingPos -> Trả về true (Vua bị chiếu).
        // TODO: [Bước 4] Trả về false nếu không quân đối phương nào đe dọa Vua.
        throw new NotImplementedException();
    }

    /// <summary>
    /// Đánh giá và cập nhật trạng thái ván cờ (GameState) sau mỗi nước đi thành công.
    /// </summary>
    private void UpdateGameState()
    {
        bool hasLegalMoves = false;
        for (int r = 0; r < 8; r++)
        {
            for (int c = 0; c < 8; c++)
            {
                Piece? piece = Board[r, c];
                if (piece != null && piece.Color == CurrentTurn)
                {
                    if (GetLegalMoves(new Position(r, c)).Any())
                    {
                        hasLegalMoves = true;
                        break;
                    }
                }
            }
            if (hasLegalMoves) break;
        }

        GameState oldStatus = Status;

        if (!hasLegalMoves)
        {
            if (IsKingInCheck(CurrentTurn))
            {
                Status = GameState.Checkmate;
            }
            else
            {
                Status = GameState.Stalemate;
            }
        }
        else
        {
            if (IsKingInCheck(CurrentTurn))
            {
                Status = GameState.Check;
            }
            else
            {
                Status = GameState.Active;
            }
        }

        if (Status != oldStatus)
        {
            GameStateChanged?.Invoke(this, new GameStateChangedEventArgs(Status));
        }
    }

    /// <summary>
    /// Trả về nước đi gần nhất được thực hiện trong ván đấu.
    /// </summary>
    public Move? GetLastMove()
    {
        // TODO: Trả về phần tử cuối trong MoveHistory hoặc null nếu chưa có nước đi nào.
        throw new NotImplementedException();
    }
}

/// <summary>
/// Event Argument chứa dữ liệu cho sự kiện di chuyển quân cờ thành công.
/// </summary>
public class MoveExecutedEventArgs : EventArgs
{
    public Move ExecutedMove { get; }
    public MoveExecutedEventArgs(Move move) => ExecutedMove = move;
}

/// <summary>
/// Event Argument chứa dữ liệu cho sự kiện thay đổi trạng thái ván đấu.
/// </summary>
public class GameStateChangedEventArgs : EventArgs
{
    public GameState NewState { get; }
    public GameStateChangedEventArgs(GameState state) => NewState = state;
}
