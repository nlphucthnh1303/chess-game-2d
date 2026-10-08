// ============================================================
// SpriteUtils.js — Cắt sprite từ team atlas image
// White team atlas: 2 rows × 6 cols = 12 sprites (top row used)
// Black team atlas: 1 row × 6 cols = 6 sprites
// Order: Pawn, Rook, Knight, Bishop, Queen, King
// ============================================================

const PIECE_ORDER = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];

export class SpriteUtils {
  /**
   * Slice a team atlas into individual textures.
   * @param {Phaser.Scene} scene
   * @param {string} atlasKey  — preloaded image key
   * @param {string} teamColor — 'white' | 'black'
   * @param {boolean} useTopRow — white atlas has 2 rows; use top
   */
  static sliceTeamAtlas(scene, atlasKey, teamColor, useTopRow = true) {
    const texture = scene.textures.get(atlasKey);
    const src = texture.getSourceImage();
    const totalW = src.naturalWidth || src.width;
    const totalH = src.naturalHeight || src.height;

    // Determine how many rows atlas has and choose the row
    const colCount = 6;
    const rowCount = useTopRow && (totalH / (totalW / colCount) > 1.4) ? 2 : 1;
    const frameW = Math.floor(totalW / colCount);
    const frameH = Math.floor(totalH / rowCount);
    const rowIndex = useTopRow ? 0 : 0; // always top row, black has 1 row

    PIECE_ORDER.forEach((pieceName, i) => {
      const key = `${teamColor}_${pieceName}`;
      if (scene.textures.exists(key)) return;

      // Create a canvas to extract the frame
      const canvas = document.createElement('canvas');
      canvas.width = frameW;
      canvas.height = frameH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(src, i * frameW, rowIndex * frameH, frameW, frameH, 0, 0, frameW, frameH);

      // Add as texture
      scene.textures.addCanvas(key, canvas);
    });
  }

  /**
   * Get the Phaser texture key for a piece
   */
  static getKey(color, type) {
    const typeMap = { P: 'pawn', R: 'rook', N: 'knight', B: 'bishop', Q: 'queen', K: 'king' };
    return `${color === 'w' ? 'white' : 'black'}_${typeMap[type] || 'pawn'}`;
  }
}
