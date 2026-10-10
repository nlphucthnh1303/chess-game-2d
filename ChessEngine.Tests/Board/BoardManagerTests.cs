using System;
using Xunit;
using ChessEngine.Board;
using ChessEngine.Models;
using ChessEngine.Pieces;
using ChessEngine.Enums;
using System.Collections.Generic;

namespace ChessEngine.Tests.Board;

// A simple dummy piece for testing GetPiece
public class DummyPiece : Piece
{
    public DummyPiece(ChessColor color) : base(color) { }
    public override PieceType Type => PieceType.Pawn; // arbitrary type
    public override IEnumerable<Move> GetPossibleMoves(Position currentPos, BoardManager board) => new List<Move>();
    public override Piece Copy() => new DummyPiece(Color);
}

public class BoardManagerTests
{
    [Fact]
    public void GetPiece_ValidPositionWithPiece_ReturnsPiece()
    {
        // Setup
        var boardManager = new BoardManager();
        var position = new Position(3, 4);
        var piece = new DummyPiece(ChessColor.White);
        boardManager.SetPiece(position, piece);

        // Act
        var result = boardManager.GetPiece(position);

        // Assert
        Assert.Same(piece, result);
    }

    [Fact]
    public void GetPiece_ValidPositionEmpty_ReturnsNull()
    {
        // Setup
        var boardManager = new BoardManager();
        var position = new Position(3, 4);
        // Do not set piece

        // Act
        var result = boardManager.GetPiece(position);

        // Assert
        Assert.Null(result);
    }

    [Theory]
    [InlineData(-1, 0)]
    [InlineData(0, -1)]
    [InlineData(8, 0)]
    [InlineData(0, 8)]
    [InlineData(-1, -1)]
    [InlineData(8, 8)]
    public void GetPiece_InvalidPosition_ThrowsArgumentOutOfRangeException(int row, int col)
    {
        // Setup
        var boardManager = new BoardManager();
        var position = new Position(row, col);

        // Act & Assert
        Assert.Throws<ArgumentOutOfRangeException>(() => boardManager.GetPiece(position));
    }
}
