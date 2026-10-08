// ============================================================
// main.js — Phaser 3 Game Entry Point
// ============================================================
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene }    from './scenes/MenuScene.js';
import { GameScene }    from './scenes/GameScene.js';

// ============================================================
// Responsive sizing — target 1280x800 but scale to window
// ============================================================
const BASE_W = 1280;
const BASE_H = 800;

function getGameSize() {
  const scaleW = window.innerWidth  / BASE_W;
  const scaleH = window.innerHeight / BASE_H;
  const scale  = Math.min(scaleW, scaleH, 1.5); // allow up to 1.5x for big screens
  return {
    width:  Math.floor(BASE_W * scale),
    height: Math.floor(BASE_H * scale)
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
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 800, height: 500 },
    max: { width: 1920, height: 1200 }
  },
  render: {
    antialias:    true,
    pixelArt:     false,
    roundPixels:  false,
    transparent:  false
  },
  input: {
    activePointers: 1
  },
  dom: {
    createContainer: false
  }
};

const game = new Phaser.Game(config);

// ============================================================
// Handle resize
// ============================================================
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const { width: w, height: h } = getGameSize();
    game.scale.resize(w, h);
  }, 100);
});

// ============================================================
// Prevent context menu on right-click (cleaner game feel)
// ============================================================
document.addEventListener('contextmenu', e => e.preventDefault());

// ============================================================
// Export game instance for debugging
// ============================================================
if (typeof window !== 'undefined') window.__CHIBI_CHESS__ = game;
