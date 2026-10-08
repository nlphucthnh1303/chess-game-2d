using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using ChessEngine.Engine;
using ChessEngine.Models;
using ChessEngine.Enums;
using ChessUI.Helpers;
using System.Windows.Media.Imaging;

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

    private readonly Brush _lightSquareBrush = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#F0D9B5"));
    private readonly Brush _darkSquareBrush = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#B58863"));

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
        BtnNewGame_Click(this, new RoutedEventArgs());
    }

    /// <summary>
    /// Khởi tạo 64 nút (Button) tương ứng với 64 ô cờ trên UniformGrid.
    /// Gán màu nền xen kẽ (Ô sáng / Ô tối) và đăng ký sự kiện Click cho mỗi ô.
    /// </summary>
    private void InitializeBoardUI()
    {
        BoardUniformGrid.Children.Clear();

        for (int row = 0; row < 8; row++)
        {
            for (int col = 0; col < 8; col++)
            {
                Button btn = new Button();
                btn.Background = (row + col) % 2 == 0 ? _lightSquareBrush : _darkSquareBrush;
                btn.BorderThickness = new Thickness(0);
                btn.Tag = new Position(row, col);
                btn.Click += SquareButton_Click;

                // Add style so it doesnt look like a default button
                if (Application.Current.Resources.Contains("ChessSquareStyle"))
                {
                    btn.Style = (Style)Application.Current.Resources["ChessSquareStyle"];
                }
                else
                {
                    btn.Style = (Style)FindResource(ToolBar.ButtonStyleKey);
                }

                _squareButtons[row, col] = btn;
                BoardUniformGrid.Children.Add(btn);
            }
        }
    }

    /// <summary>
    /// Vẽ lại toàn bộ quân cờ trên các ô giao diện dựa theo dữ liệu từ _gameManager.Board.
    /// </summary>
    private void RenderBoard()
    {
        for (int r = 0; r < 8; r++)
        {
            for (int c = 0; c < 8; c++)
            {
                var piece = _gameManager.Board[r, c];
                Button btn = _squareButtons[r, c];

                // Reset background color
                btn.Background = (r + c) % 2 == 0 ? _lightSquareBrush : _darkSquareBrush;

                if (piece == null)
                {
                    btn.Content = null;
                }
                else
                {
                    string imagePath = ChessImageHelper.GetPieceImagePath(piece.Color, piece.Type);
                    Image img = new Image
                    {
                        Source = new BitmapImage(new Uri(imagePath)),
                        Margin = new Thickness(5)
                    };
                    btn.Content = img;
                }
            }
        }
    }

    /// <summary>
    /// Xử lý sự kiện khi người dùng click vào một ô cờ trên bàn cờ.
    /// Implementation gợi ý luồng tư duy xử lý chọn ô và di chuyển.
    /// </summary>
    private void SquareButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not Position clickedPos)
            return;

        if (_selectedPosition == null)
        {
            var piece = _gameManager.Board.GetPiece(clickedPos);
            if (piece != null && piece.Color == _gameManager.CurrentTurn)
            {
                _selectedPosition = clickedPos;
                _activeLegalMoves = _gameManager.GetLegalMoves(clickedPos).ToList();
                HighlightLegalMoves();
            }
        }
        else
        {
            Move? targetMove = _activeLegalMoves.FirstOrDefault(m => m.EndPosition == clickedPos);
            if (targetMove != null)
            {
                if (targetMove.Type == MoveType.Promotion)
                {
                    // In a real app we'd ask the user, but for now just auto-queen
                    targetMove = new Move(targetMove.StartPosition, targetMove.EndPosition, MoveType.Promotion, PieceType.Queen);
                }

                _gameManager.MakeMove(targetMove);
                _selectedPosition = null;
                _activeLegalMoves.Clear();
            }
            else
            {
                var piece = _gameManager.Board.GetPiece(clickedPos);
                if (piece != null && piece.Color == _gameManager.CurrentTurn)
                {
                    RenderBoard(); // reset highlights
                    _selectedPosition = clickedPos;
                    _activeLegalMoves = _gameManager.GetLegalMoves(clickedPos).ToList();
                    HighlightLegalMoves();
                }
                else
                {
                    _selectedPosition = null;
                    _activeLegalMoves.Clear();
                    RenderBoard();
                }
            }
        }
    }

    /// <summary>
    /// Tô màu nổi bật (Highlight) cho ô cờ đang chọn và tất cả các ô nước đi hợp lệ.
    /// </summary>
    private void HighlightLegalMoves()
    {
        if (_selectedPosition.HasValue)
        {
            _squareButtons[_selectedPosition.Value.Row, _selectedPosition.Value.Column].Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#F6F669"));
        }

        foreach (var move in _activeLegalMoves)
        {
            _squareButtons[move.EndPosition.Row, move.EndPosition.Column].Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#B9CA43"));
        }
    }

    /// <summary>
    /// Xử lý sự kiện khi một nước đi thực thi thành công từ Engine.
    /// Cập nhật giao diện bàn cờ, danh sách lịch sử và lượt đi.
    /// </summary>
    private void OnMoveExecuted(object? sender, MoveExecutedEventArgs e)
    {
        RenderBoard();
        LstMoveHistory.Items.Add(e.ExecutedMove.ToString());
        LstMoveHistory.ScrollIntoView(LstMoveHistory.Items[LstMoveHistory.Items.Count - 1]);

        TxtCurrentTurn.Text = _gameManager.CurrentTurn == ChessColor.White ? "Trắng (White)" : "Đen (Black)";
        TxtCurrentTurn.Foreground = _gameManager.CurrentTurn == ChessColor.White ? new SolidColorBrush((Color)ColorConverter.ConvertFromString("#EDF2F4")) : new SolidColorBrush((Color)ColorConverter.ConvertFromString("#8D99AE"));
    }

    /// <summary>
    /// Xử lý sự kiện khi trạng thái ván cờ thay đổi (Chiếu cờ, Chiếu bí, Hòa...).
    /// </summary>
    private void OnGameStateChanged(object? sender, GameStateChangedEventArgs e)
    {
        TxtGameState.Text = e.NewState.ToString();

        if (e.NewState == GameState.Checkmate)
        {
            string winner = _gameManager.CurrentTurn == ChessColor.White ? "Đen (Black)" : "Trắng (White)";
            MessageBox.Show($"Chiếu bí! {winner} giành chiến thắng.", "Kết thúc ván đấu", MessageBoxButton.OK, MessageBoxImage.Information);
        }
        else if (e.NewState == GameState.Stalemate || e.NewState == GameState.DrawByInsufficientMaterial || e.NewState == GameState.DrawByRule)
        {
            MessageBox.Show("Hòa cờ!", "Kết thúc ván đấu", MessageBoxButton.OK, MessageBoxImage.Information);
        }
    }

    /// <summary>
    /// Nút Ván đấu mới: Đặt lại trò chơi từ đầu.
    /// </summary>
    private void BtnNewGame_Click(object sender, RoutedEventArgs e)
    {
        _gameManager.StartNewGame();
        LstMoveHistory.Items.Clear();
        _selectedPosition = null;
        _activeLegalMoves.Clear();
        TxtCurrentTurn.Text = "Trắng (White)";
        TxtCurrentTurn.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#EDF2F4"));
        TxtGameState.Text = "Đang diễn ra";
        RenderBoard();
    }

    /// <summary>
    /// Nút Hoàn nước đi (Undo Move).
    /// </summary>
    private void BtnUndoMove_Click(object sender, RoutedEventArgs e)
    {
        MessageBox.Show("Tính năng hoàn nước đi chưa được triển khai.", "Thông báo", MessageBoxButton.OK, MessageBoxImage.Information);
    }
}