using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using ChessEngine.Engine;
using ChessEngine.Models;
using ChessEngine.Enums;

namespace ChessUI;

/// <summary>
/// Logic tương tác giao diện người dùng (Code-behind) cho MainWindow.xaml.
/// Đảm bảo nguyên tắc Tách biệt Giao diện (UI) và Thuật toán (Chess Engine).
/// </summary>
public partial class MainWindow : Window
{
    /// <summary>
    /// Đối tượng GameManager đóng vai trò là Engine điều khiển toàn bộ ván cờ.
    /// </summary>
    private readonly GameManager _gameManager;

    /// <summary>
    /// Ô cờ đang được chọn hiện tại trên giao diện (null nếu chưa chọn ô nào).
    /// </summary>
    private Position? _selectedPosition;

    /// <summary>
    /// Danh sách các nước đi hợp lệ của ô cờ đang chọn (dùng để tô màu gợi ý ô có thể đi).
    /// </summary>
    private List<Move> _activeLegalMoves;

    /// <summary>
    /// Mảng 2 chiều 8x8 chứa các Button đại diện cho 64 ô cờ trên giao diện WPF.
    /// </summary>
    private readonly Button[,] _squareButtons = new Button[8, 8];

    public MainWindow()
    {
        InitializeComponent();

        _gameManager = new GameManager();
        _activeLegalMoves = new List<Move>();

        // Lắng nghe các sự kiện phát ra từ ChessEngine
        _gameManager.MoveExecuted += OnMoveExecuted;
        _gameManager.GameStateChanged += OnGameStateChanged;

        // Khởi tạo lưới 64 ô cờ giao diện
        InitializeBoardUI();
    }

    /// <summary>
    /// Khởi tạo 64 nút (Button) tương ứng với 64 ô cờ trên UniformGrid.
    /// Gán màu nền xen kẽ (Ô sáng / Ô tối) và đăng ký sự kiện Click cho mỗi ô.
    /// </summary>
    private void InitializeBoardUI()
    {
        // TODO: [Bước 1] Xóa sạch các child element trong BoardUniformGrid.Children.
        // TODO: [Bước 2] Lặp qua 8 hàng (row 0..7) và 8 cột (col 0..7):
        //       - Tạo một Button đại diện cho ô cờ.
        //       - Xác định màu ô cờ: if ((row + col) % 2 == 0) màu sáng, ngược lại màu tối.
        //       - Lưu Button vào mảng _squareButtons[row, col].
        //       - Đăng ký sự kiện button.Click += SquareButton_Click với Tag chứa vị trí Position(row, col).
        //       - Thêm button vào BoardUniformGrid.Children.
        throw new NotImplementedException();
    }

    /// <summary>
    /// Vẽ lại toàn bộ quân cờ trên các ô giao diện dựa theo dữ liệu từ _gameManager.Board.
    /// </summary>
    private void RenderBoard()
    {
        // TODO: [Bước 1] Duyệt r từ 0..7 và c từ 0..7.
        // TODO: [Bước 2] Lấy quân cờ tại ô (r, c) từ _gameManager.Board[r, c].
        // TODO: [Bước 3] Nếu ô trống -> Gán Content của _squareButtons[r, c] = null.
        // TODO: [Bước 4] Nếu ô có quân cờ -> Dùng ChessImageHelper.GetPieceImagePath() để nạp hình ảnh và hiển thị lên Content của Button.
        // TODO: [Bước 5] Đặt lại màu nền gốc của ô cờ (xóa các màu highlight trước đó).
        throw new NotImplementedException();
    }

    /// <summary>
    /// Xử lý sự kiện khi người dùng click vào một ô cờ trên bàn cờ.
    /// Implementation gợi ý luồng tư duy xử lý chọn ô và di chuyển.
    /// </summary>
    private void SquareButton_Click(object sender, RoutedEventArgs e)
    {
        // TODO: [Bước 1] Lấy vị trí ô cờ click (clickedPos) từ Tag của Button gửi tới.
        // TODO: [Bước 2] Nếu chưa chọn ô nào (_selectedPosition == null):
        //       - Lấy quân cờ tại clickedPos. Nếu là quân thuộc lượt đi hiện tại (_gameManager.CurrentTurn):
        //           + Gán _selectedPosition = clickedPos.
        //           + Lấy danh sách nước đi hợp lệ: _activeLegalMoves = _gameManager.GetLegalMoves(clickedPos).ToList().
        //           + Highlight ô đang chọn và các ô đích khả thi (HighlightLegalMoves()).
        // TODO: [Bước 3] Nếu ĐÃ chọn ô trước đó (_selectedPosition != null):
        //       - Tìm xem clickedPos có nằm trong danh sách _activeLegalMoves hay không.
        //       - Nếu CÓ -> Thực hiện nước đi: _gameManager.MakeMove(targetMove), sau đó reset _selectedPosition = null.
        //       - Nếu KHÔNG -> Kiểm tra xem clickedPos có phải là một quân cờ khác phe mình không.
        //           + Nếu đúng -> Chuyển ô chọn mới sang clickedPos và highlight lại.
        //           + Nếu sai -> Bỏ chọn (_selectedPosition = null) và reset màu bàn cờ.
        throw new NotImplementedException();
    }

    /// <summary>
    /// Tô màu nổi bật (Highlight) cho ô cờ đang chọn và tất cả các ô nước đi hợp lệ.
    /// </summary>
    private void HighlightLegalMoves()
    {
        // TODO: [Bước 1] Đổi màu nền của Button tại ô _selectedPosition (Ví dụ: màu Vàng/Xanh lá mạ).
        // TODO: [Bước 2] Với mỗi move trong _activeLegalMoves -> Đổi màu nền ô EndPosition (Ví dụ: Chấm tròn gợi ý hoặc viền xanh).
        throw new NotImplementedException();
    }

    /// <summary>
    /// Xử lý sự kiện khi một nước đi thực thi thành công từ Engine.
    /// Cập nhật giao diện bàn cờ, danh sách lịch sử và lượt đi.
    /// </summary>
    private void OnMoveExecuted(object? sender, MoveExecutedEventArgs e)
    {
        RenderBoard();
        LstMoveHistory.Items.Add(e.ExecutedMove.ToString());
        TxtCurrentTurn.Text = _gameManager.CurrentTurn == ChessColor.White ? "Trắng (White)" : "Đen (Black)";
    }

    /// <summary>
    /// Xử lý sự kiện khi trạng thái ván cờ thay đổi (Chiếu cờ, Chiếu bí, Hòa...).
    /// </summary>
    private void OnGameStateChanged(object? sender, GameStateChangedEventArgs e)
    {
        // TODO: [Bước 1] Cập nhật TxtGameState.Text hiển thị trạng thái mới.
        // TODO: [Bước 2] Nếu state == Checkmate hoặc Stalemate -> Hiển thị MessageBox thông báo người thắng/kết quả ván cờ.
        throw new NotImplementedException();
    }

    /// <summary>
    /// Nút Ván đấu mới: Đặt lại trò chơi từ đầu.
    /// </summary>
    private void BtnNewGame_Click(object sender, RoutedEventArgs e)
    {
        // TODO: [Bước 1] Gọi _gameManager.StartNewGame().
        // TODO: [Bước 2] Gọi LstMoveHistory.Items.Clear().
        // TODO: [Bước 3] Gọi RenderBoard().
        throw new NotImplementedException();
    }

    /// <summary>
    /// Nút Hoàn nước đi (Undo Move).
    /// </summary>
    private void BtnUndoMove_Click(object sender, RoutedEventArgs e)
    {
        // TODO: [Bước 1] Gọi thuật toán Undo trong GameManager (nếu có triển khai).
        // TODO: [Bước 2] Cập nhật lại UI.
        throw new NotImplementedException();
    }
}