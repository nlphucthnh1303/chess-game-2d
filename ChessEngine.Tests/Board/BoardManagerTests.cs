using Xunit;
using ChessEngine.Board;
using ChessEngine.Models;
using ChessEngine.Pieces;
using ChessEngine.Enums;
using System.Reflection;

namespace ChessEngine.Tests.Board;

public class BoardManagerTests
{
    [Fact]
    public void SetPiece_ValidPosition_SetsPieceInInternalArray()
    {
        // Arrange
        var boardManager = new BoardManager();
        var position = new Position(3, 4);
        var pawn = new Pawn(ChessColor.White);

        // Act
        boardManager.SetPiece(position, pawn);

        // Assert
        var fieldInfo = typeof(BoardManager).GetField("_pieces", BindingFlags.NonPublic | BindingFlags.Instance);
        var piecesArray = (Piece?[,])fieldInfo!.GetValue(boardManager)!;

        Assert.Equal(pawn, piecesArray[3, 4]);
    }

    [Fact]
    public void SetPiece_NullPiece_ClearsPositionInInternalArray()
    {
        // Arrange
        var boardManager = new BoardManager();
        var position = new Position(5, 5);
        var pawn = new Pawn(ChessColor.Black);

        var fieldInfo = typeof(BoardManager).GetField("_pieces", BindingFlags.NonPublic | BindingFlags.Instance);
        var piecesArray = (Piece?[,])fieldInfo!.GetValue(boardManager)!;
        piecesArray[5, 5] = pawn; // Setup initial state manually

        // Act
        boardManager.SetPiece(position, null);

        // Assert
        Assert.Null(piecesArray[5, 5]);
    }

    [Theory]
    [InlineData(-1, 0)]
    [InlineData(8, 0)]
    [InlineData(0, -1)]
    [InlineData(0, 8)]
    [InlineData(8, 8)]
    public void SetPiece_InvalidPosition_ThrowsArgumentOutOfRangeException(int row, int col)
    {
        // Arrange
        var boardManager = new BoardManager();
        var position = new Position(row, col);
        var pawn = new Pawn(ChessColor.White);

        // Act & Assert
        Assert.Throws<ArgumentOutOfRangeException>(() => boardManager.SetPiece(position, pawn));
    }
}
