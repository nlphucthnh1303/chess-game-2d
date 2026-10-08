// ============================================================
// main.js — Phaser 3 Game Entry Point
// ============================================================
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene }    from './scenes/MenuScene.js';
import { GameScene }    from './scenes/GameScene.js';

// Responsive sizing
function getGameSize() {
  const maxW = 1200, maxH = 760;
  const scaleW = window.innerWidth / maxW;
  const scaleH = window.innerHeight / maxH;
  const scale = Math.min(scaleW, scaleH, 1);
  return {
    width:  Math.floor(maxW * scale),
    height: Math.floor(maxH * scale)
  };
}

const { width, height } = getGameSize();

const config = {
  type: Phaser.AUTO,
  width,
  height,
  backgroundColor: '#0d0a1a',
  parent: 'phaser-container',
  scene: [PreloadScene, MenuScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  }
};

const game = new Phaser.Game(config);

// Handle resize
window.addEventListener('resize', () => {
  const { width: w, height: h } = getGameSize();
  game.scale.resize(w, h);
});
