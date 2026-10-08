// ============================================================
// PreloadScene.js — Load all assets before game starts
// ============================================================
import { SpriteUtils } from '../utils/SpriteUtils.js';

export class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  preload() {
    this.createLoadingUI();

    // Progress bar
    this.load.on('progress', (value) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x7c6af7, 1);
      this.progressBar.fillRoundedRect(
        this.scale.width / 2 - 200, this.scale.height / 2 + 30,
        400 * value, 16, 8
      );
      if (this.progressText) {
        this.progressText.setText(`${Math.floor(value * 100)}%`);
      }
    });

    this.load.on('complete', () => {
      this.progressText?.setText('100%');
    });

    // ---- Load team images (full atlas image) ----
    this.load.image('white_team_atlas', 'assets/pieces/white/white_team.jpg');
    this.load.image('black_team_atlas', 'assets/pieces/black/black_team.jpg');

    // ---- Board texture (generated in-code) ----
    // No external board image needed — we draw it procedurally

    // ---- Particle ----
    this.load.image('particle', this.makeParticleDataURL());
  }

  create() {
    // Slice individual chibi sprites from team atlas
    SpriteUtils.sliceTeamAtlas(this, 'white_team_atlas', 'white', true);
    SpriteUtils.sliceTeamAtlas(this, 'black_team_atlas', 'black', false);

    // Short delay to see the loading screen
    this.time.delayedCall(400, () => {
      this.scene.start('MenuScene');
    });
  }

  createLoadingUI() {
    const { width, height } = this.scale;
    const cx = width / 2, cy = height / 2;

    // Background
    this.add.rectangle(cx, cy, width, height, 0x0d0a1a);

    // Stars
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const alpha = Phaser.Math.FloatBetween(0.2, 0.9);
      const star = this.add.circle(x, y, size, 0xffffff, alpha);
      this.tweens.add({
        targets: star, alpha: { from: alpha, to: alpha * 0.3 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true, repeat: -1
      });
    }

    // Title
    this.add.text(cx, cy - 100, '⚔ CHIBI CHESS ⚔', {
      fontFamily: "'Cinzel', serif",
      fontSize: '42px',
      color: '#f0d9b5',
      stroke: '#c9a227',
      strokeThickness: 2,
      shadow: { color: '#7c6af7', blur: 20, fill: true }
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(cx, cy - 50, 'Cờ Vua Chibi Kỳ Ảo', {
      fontFamily: "'Inter', sans-serif",
      fontSize: '16px',
      color: 'rgba(200,190,255,0.7)'
    }).setOrigin(0.5);

    // Loading bar background
    this.add.rectangle(cx, cy + 38, 402, 18, 0x1a1232, 1)
      .setStrokeStyle(1, 0x3a2a5a);

    // Progress fill
    this.progressBar = this.add.graphics();

    // Progress text
    this.progressText = this.add.text(cx, cy + 70, '0%', {
      fontFamily: "'Inter', sans-serif",
      fontSize: '13px',
      color: 'rgba(180,170,255,0.7)'
    }).setOrigin(0.5);

    this.add.text(cx, cy + 38, 'Đang tải...', {
      fontFamily: "'Inter', sans-serif",
      fontSize: '12px',
      color: 'rgba(150,140,200,0.5)'
    }).setOrigin(0.5);
  }

  makeParticleDataURL() {
    // Create a tiny glowing particle as data URL
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const ctx = c.getContext('2d');
    const grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.3, 'rgba(200,180,255,0.8)');
    grd.addColorStop(1, 'rgba(100,80,200,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 32, 32);
    return c.toDataURL();
  }
}
